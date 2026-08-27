const { readData, writeData, addItem, updateItem, deleteItem, findById, findUserById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ============================================
// HELPER: Check if user is admin
// ============================================
function isAdmin(user) {
    return user && (user.role === 'super_admin' || user.role === 'ceo_admin');
}

// ============================================
// HELPER: Check if user is bulk buyer
// ============================================
function isBulkBuyer(user) {
    return user && (user.role === 'bulk_buyer' || user.userType === 'bulk');
}

// ============================================
// REGISTER BULK BUYER (Auto-Approved)
// ============================================
exports.registerBulkBuyer = async (req, res) => {
    try {
        const {
            companyName,
            registrationNumber,
            businessType,
            contactPerson,
            email,
            phone,
            password,
            minOrderQuantity,
            termsAccepted
        } = req.body;

        // Validate required fields
        if (!companyName || !email || !password || !contactPerson || !phone || !businessType) {
            return res.status(400).json({
                success: false,
                message: 'Company name, email, password, contact person, phone, and business type are required'
            });
        }

        if (!termsAccepted) {
            return res.status(400).json({
                success: false,
                message: 'You must agree to the terms and conditions'
            });
        }

        // Check if email already exists
        const users = readData('users') || [];
        if (users.find(u => u.email === email)) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Check if company name already exists
        if (users.find(u => u.name === companyName || u.companyDetails?.companyName === companyName)) {
            return res.status(400).json({
                success: false,
                message: 'Company name already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create bulk buyer user (AUTO-APPROVED)
        const newUser = {
            id: uuidv4(),
            name: companyName,
            email: email,
            password: hashedPassword,
            phone: phone,
            role: 'bulk_buyer',
            userType: 'bulk',
            isApproved: true,
            termsAccepted: true,
            termsAcceptedAt: new Date().toISOString(),
            companyDetails: {
                companyName: companyName,
                registrationNumber: registrationNumber || '',
                businessType: businessType,
                address: '',
                contactPerson: contactPerson,
                phone: phone
            },
            bulkSettings: {
                minOrderQuantity: parseInt(minOrderQuantity) || 10,
                discountRate: 15,
                creditLimit: 500000,
                paymentTerms: '30 days',
                commissionRate: 5
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('users', newUser);

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET || 'modern_furniture_secret_2026',
            { expiresIn: '365d' }
        );

        // Notify admins
        const admins = readData('admins') || [];
        const notification = {
            id: uuidv4(),
            type: 'bulk_registration',
            title: '🏢 New Bulk Buyer Registered',
            message: `${companyName} has registered as a bulk buyer.`,
            read: false,
            createdAt: new Date().toISOString(),
            userId: newUser.id
        };

        admins.forEach(admin => {
            const adminNotif = { ...notification, adminId: admin.id };
            addItem('notifications', adminNotif);
        });

        console.log(`🏢 New bulk buyer registered: ${companyName} (${email})`);

        // Remove password from response
        const { password: _, ...safeUser } = newUser;

        res.status(201).json({
            success: true,
            user: safeUser,
            token: token,
            message: '✅ Registration successful! You can now login and start placing bulk orders.'
        });
    } catch (error) {
        console.error('❌ Register bulk buyer error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL BULK BUYERS (Admin only)
// ============================================
exports.getBulkBuyers = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { status, approved } = req.query;
        let users = readData('users') || [];

        // Filter bulk buyers only
        let bulkBuyers = users.filter(u => u.role === 'bulk_buyer' || u.userType === 'bulk');

        if (status === 'pending') {
            bulkBuyers = bulkBuyers.filter(u => u.isApproved === false);
        } else if (status === 'approved') {
            bulkBuyers = bulkBuyers.filter(u => u.isApproved === true);
        } else if (approved === 'true') {
            bulkBuyers = bulkBuyers.filter(u => u.isApproved === true);
        } else if (approved === 'false') {
            bulkBuyers = bulkBuyers.filter(u => u.isApproved === false);
        }

        // Remove sensitive data
        const safeBuyers = bulkBuyers.map(b => {
            const { password, ...rest } = b;
            return rest;
        });

        res.json({
            success: true,
            buyers: safeBuyers,
            total: safeBuyers.length
        });
    } catch (error) {
        console.error('❌ Get bulk buyers error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET SINGLE BULK BUYER (Admin only)
// ============================================
exports.getBulkBuyer = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { id } = req.params;
        const user = findUserById('users', id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Bulk buyer not found'
            });
        }

        if (user.role !== 'bulk_buyer' && user.userType !== 'bulk') {
            return res.status(400).json({
                success: false,
                message: 'User is not a bulk buyer'
            });
        }

        const { password, ...safeUser } = user;

        // Get bulk orders
        const orders = readData('orders') || [];
        const bulkOrders = orders.filter(o => o.userId === id && o.isBulk === true);

        res.json({
            success: true,
            buyer: safeUser,
            orders: bulkOrders,
            orderCount: bulkOrders.length
        });
    } catch (error) {
        console.error('❌ Get bulk buyer error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// APPROVE BULK BUYER (Admin only)
// ============================================
exports.approveBulkBuyer = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { id } = req.params;
        const user = findUserById('users', id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role !== 'bulk_buyer' && user.userType !== 'bulk') {
            return res.status(400).json({
                success: false,
                message: 'User is not a bulk buyer'
            });
        }

        user.isApproved = true;
        user.approvedAt = new Date().toISOString();
        user.approvedBy = req.user.id;
        user.updatedAt = new Date().toISOString();

        updateItem('users', id, user);

        // Create notification for bulk buyer
        const notification = {
            id: uuidv4(),
            userId: user.id,
            type: 'bulk_approved',
            title: '✅ Bulk Account Approved!',
            message: `Dear ${user.name},\n\nYour bulk buyer account has been approved! You can now place bulk orders and access special pricing.\n\n📦 Minimum order: ${user.bulkSettings?.minOrderQuantity || 10} units\n💰 Discount: ${user.bulkSettings?.discountRate || 15}%\n\nStart shopping today!`,
            read: false,
            createdAt: new Date().toISOString()
        };
        addItem('notifications', notification);

        // Send socket notification
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${user.id}`).emit('new-notification', notification);
            io.to(`user_${user.id}`).emit('bulk-approved', { userId: user.id });
        }

        console.log(`✅ Bulk buyer approved: ${user.name} (${user.email})`);

        res.json({
            success: true,
            buyer: user,
            message: '✅ Bulk buyer approved successfully!'
        });
    } catch (error) {
        console.error('❌ Approve bulk buyer error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// REJECT BULK BUYER (Admin only)
// ============================================
exports.rejectBulkBuyer = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { id } = req.params;
        const { reason } = req.body;
        const user = findUserById('users', id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role !== 'bulk_buyer' && user.userType !== 'bulk') {
            return res.status(400).json({
                success: false,
                message: 'User is not a bulk buyer'
            });
        }

        user.isApproved = false;
        user.rejectedAt = new Date().toISOString();
        user.rejectedBy = req.user.id;
        user.rejectionReason = reason || 'No reason provided';
        user.updatedAt = new Date().toISOString();

        updateItem('users', id, user);

        // Create notification for bulk buyer
        const notification = {
            id: uuidv4(),
            userId: user.id,
            type: 'bulk_rejected',
            title: '📋 Bulk Account Update',
            message: `Dear ${user.name},\n\nThank you for your interest in becoming a bulk buyer.\n\nAfter review, we are unable to approve your account at this time.\n\nReason: ${reason || 'No reason provided'}\n\nPlease contact us if you have any questions.`,
            read: false,
            createdAt: new Date().toISOString()
        };
        addItem('notifications', notification);

        console.log(`❌ Bulk buyer rejected: ${user.name} (${user.email})`);

        res.json({
            success: true,
            message: '✅ Bulk buyer rejected. User has been notified.'
        });
    } catch (error) {
        console.error('❌ Reject bulk buyer error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// DELETE BULK BUYER (Admin only)
// ============================================
exports.deleteBulkBuyer = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { id } = req.params;
        const user = findUserById('users', id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role !== 'bulk_buyer' && user.userType !== 'bulk') {
            return res.status(400).json({
                success: false,
                message: 'User is not a bulk buyer'
            });
        }

        deleteItem('users', id);

        console.log(`🗑️ Bulk buyer deleted: ${user.name} (${user.email})`);

        res.json({
            success: true,
            message: '🗑️ Bulk buyer deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete bulk buyer error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// PLACE BULK ORDER (Bulk Buyer only)
// ============================================
exports.placeBulkOrder = async (req, res) => {
    try {
        // Check if user is bulk buyer
        if (!req.user || !isBulkBuyer(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Bulk buyer only.'
            });
        }

        const {
            items,
            deliveryAddress,
            deliveryDate,
            specialInstructions,
            quantity
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one item is required'
            });
        }

        // Verify user is approved bulk buyer
        const user = findUserById('users', req.user.id);
        if (!user || user.role !== 'bulk_buyer') {
            return res.status(403).json({
                success: false,
                message: 'Only bulk buyers can place bulk orders'
            });
        }

        // Calculate total
        let total = 0;
        const products = readData('products') || [];
        const orderItems = items.map(item => {
            const product = products.find(p => p.id === item.productId);
            const price = product?.salePrice || product?.price || 0;
            const qty = item.quantity || quantity || user.bulkSettings?.minOrderQuantity || 10;
            const subtotal = price * qty;
            total += subtotal;
            return {
                productId: item.productId,
                productName: product?.name || 'Product',
                quantity: qty,
                price: price,
                subtotal: subtotal
            };
        });

        // Apply bulk discount
        const discountRate = user.bulkSettings?.discountRate || 15;
        const discount = total * (discountRate / 100);
        const finalTotal = total - discount;

        const order = {
            id: uuidv4(),
            userId: req.user.id,
            userName: user.name,
            userEmail: user.email,
            userPhone: user.phone,
            companyName: user.companyDetails?.companyName || user.name,
            isBulk: true,
            items: orderItems,
            total: total,
            discount: discount,
            discountRate: discountRate,
            finalTotal: finalTotal,
            deliveryAddress: deliveryAddress || user.companyDetails?.address || '',
            deliveryDate: deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            specialInstructions: specialInstructions || '',
            status: 'pending',
            paymentStatus: 'pending',
            orderType: 'bulk',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('orders', order);

        // Notify admins
        const admins = readData('admins') || [];
        const notification = {
            id: uuidv4(),
            type: 'bulk_order',
            title: '📦 New Bulk Order',
            message: `${user.name} placed a bulk order worth KSh ${finalTotal.toLocaleString()}`,
            read: false,
            createdAt: new Date().toISOString(),
            orderId: order.id
        };

        admins.forEach(admin => {
            const adminNotif = { ...notification, adminId: admin.id };
            addItem('notifications', adminNotif);
        });

        console.log(`📦 New bulk order from ${user.name}: KSh ${finalTotal.toLocaleString()}`);

        res.status(201).json({
            success: true,
            order: order,
            message: '✅ Bulk order placed successfully!'
        });
    } catch (error) {
        console.error('❌ Place bulk order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET MY BULK ORDERS (Bulk Buyer only)
// ============================================
exports.getMyBulkOrders = async (req, res) => {
    try {
        // Check if user is bulk buyer
        if (!req.user || !isBulkBuyer(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Bulk buyer only.'
            });
        }

        const orders = readData('orders') || [];
        const myBulkOrders = orders.filter(o => o.userId === req.user.id && o.isBulk === true);

        myBulkOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            orders: myBulkOrders,
            total: myBulkOrders.length
        });
    } catch (error) {
        console.error('❌ Get my bulk orders error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL BULK ORDERS (Admin only)
// ============================================
exports.getBulkOrders = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { status } = req.query;
        let orders = readData('orders') || [];

        // Filter bulk orders only
        let bulkOrders = orders.filter(o => o.isBulk === true);

        if (status) {
            bulkOrders = bulkOrders.filter(o => o.status === status);
        }

        bulkOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Get user info for each order
        const enrichedOrders = bulkOrders.map(order => {
            const user = findUserById('users', order.userId);
            return {
                ...order,
                companyName: user?.companyDetails?.companyName || user?.name || 'Unknown',
                contactPerson: user?.companyDetails?.contactPerson || user?.name || 'Unknown'
            };
        });

        res.json({
            success: true,
            orders: enrichedOrders,
            total: enrichedOrders.length
        });
    } catch (error) {
        console.error('❌ Get bulk orders error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE BULK ORDER STATUS (Admin only)
// ============================================
exports.updateBulkOrderStatus = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { id } = req.params;
        const { status, notes } = req.body;

        const order = findById('orders', id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (!order.isBulk) {
            return res.status(400).json({
                success: false,
                message: 'Not a bulk order'
            });
        }

        order.status = status;
        order.notes = notes || order.notes || '';
        order.updatedAt = new Date().toISOString();
        order.updatedBy = req.user.id;

        updateItem('orders', id, order);

        // Notify the buyer
        const notification = {
            id: uuidv4(),
            userId: order.userId,
            type: 'bulk_order_update',
            title: '📦 Bulk Order Update',
            message: `Your bulk order #${order.id.slice(0, 8)} status updated to: ${status.toUpperCase()}${notes ? `\n\n📝 Notes: ${notes}` : ''}`,
            read: false,
            createdAt: new Date().toISOString()
        };
        addItem('notifications', notification);

        const io = req.app.get('io');
        if (io) {
            io.to(`user_${order.userId}`).emit('new-notification', notification);
        }

        console.log(`📦 Bulk order ${id} status updated to ${status}`);

        res.json({
            success: true,
            order: order,
            message: `✅ Bulk order status updated to ${status}`
        });
    } catch (error) {
        console.error('❌ Update bulk order error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE BULK BUYER PROFILE
// ============================================
exports.updateProfile = async (req, res) => {
    try {
        // Check if user is bulk buyer
        if (!req.user || !isBulkBuyer(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Bulk buyer only.'
            });
        }

        const {
            companyName,
            contactPerson,
            phone,
            registrationNumber,
            businessType,
            minOrderQuantity,
            address
        } = req.body;

        const user = findUserById('users', req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role !== 'bulk_buyer') {
            return res.status(400).json({
                success: false,
                message: 'User is not a bulk buyer'
            });
        }

        // Update user data
        user.name = companyName || user.name;
        user.phone = phone || user.phone;
        user.updatedAt = new Date().toISOString();

        if (!user.companyDetails) user.companyDetails = {};
        user.companyDetails.companyName = companyName || user.companyDetails.companyName;
        user.companyDetails.contactPerson = contactPerson || user.companyDetails.contactPerson;
        user.companyDetails.registrationNumber = registrationNumber || user.companyDetails.registrationNumber;
        user.companyDetails.businessType = businessType || user.companyDetails.businessType;
        user.companyDetails.address = address || user.companyDetails.address;
        user.companyDetails.phone = phone || user.companyDetails.phone;

        if (!user.bulkSettings) user.bulkSettings = {};
        user.bulkSettings.minOrderQuantity = parseInt(minOrderQuantity) || user.bulkSettings.minOrderQuantity || 10;

        updateItem('users', req.user.id, user);

        const { password, ...safeUser } = user;

        res.json({
            success: true,
            user: safeUser,
            message: '✅ Profile updated successfully'
        });
    } catch (error) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// APPLY FOR PARTNERSHIP (Bulk Buyer)
// ============================================
exports.applyPartnership = async (req, res) => {
    try {
        // Check if user is bulk buyer
        if (!req.user || !isBulkBuyer(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Bulk buyer only.'
            });
        }

        const {
            companyName,
            contactPerson,
            email,
            phone,
            businessType,
            message
        } = req.body;

        if (!companyName || !contactPerson || !email || !phone || !businessType) {
            return res.status(400).json({
                success: false,
                message: 'Company name, contact person, email, phone, and business type are required'
            });
        }

        // Check if already applied
        const partnerships = readData('partnerships') || [];
        const existing = partnerships.find(p => p.userId === req.user.id);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `You have already applied for partnership. Status: ${existing.status}`
            });
        }

        const partnership = {
            id: uuidv4(),
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            companyName: companyName,
            contactPerson: contactPerson,
            email: email,
            phone: phone,
            businessType: businessType,
            message: message || '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('partnerships', partnership);

        // Notify admins
        const admins = readData('admins') || [];
        const notification = {
            id: uuidv4(),
            type: 'partnership_request',
            title: '🤝 New Partnership Request',
            message: `${companyName} has applied for partnership.`,
            read: false,
            createdAt: new Date().toISOString(),
            partnershipId: partnership.id
        };

        admins.forEach(admin => {
            const adminNotif = { ...notification, adminId: admin.id };
            addItem('notifications', adminNotif);
        });

        console.log(`🤝 New partnership request from ${companyName}`);

        res.status(201).json({
            success: true,
            partnership: partnership,
            message: '✅ Partnership request submitted successfully!'
        });
    } catch (error) {
        console.error('❌ Apply partnership error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET PARTNERSHIP STATUS (Bulk Buyer)
// ============================================
exports.getPartnershipStatus = async (req, res) => {
    try {
        // Check if user is bulk buyer
        if (!req.user || !isBulkBuyer(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Bulk buyer only.'
            });
        }

        const partnerships = readData('partnerships') || [];
        const partnership = partnerships.find(p => p.userId === req.user.id);

        if (!partnership) {
            return res.json({
                success: true,
                partnership: null,
                message: 'No partnership application found'
            });
        }

        res.json({
            success: true,
            partnership: partnership
        });
    } catch (error) {
        console.error('❌ Get partnership status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL PARTNERSHIPS (Admin only)
// ============================================
exports.getPartnerships = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { status } = req.query;
        let partnerships = readData('partnerships') || [];

        if (status) {
            partnerships = partnerships.filter(p => p.status === status);
        }

        partnerships.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            partnerships: partnerships,
            total: partnerships.length
        });
    } catch (error) {
        console.error('❌ Get partnerships error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// APPROVE PARTNERSHIP (Admin only)
// ============================================
exports.approvePartnership = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { id } = req.params;
        const partnerships = readData('partnerships') || [];
        const partnership = partnerships.find(p => p.id === id);

        if (!partnership) {
            return res.status(404).json({
                success: false,
                message: 'Partnership request not found'
            });
        }

        partnership.status = 'approved';
        partnership.approvedAt = new Date().toISOString();
        partnership.approvedBy = req.user.id;
        partnership.updatedAt = new Date().toISOString();

        updateItem('partnerships', id, partnership);

        // Notify user
        const notification = {
            id: uuidv4(),
            userId: partnership.userId,
            type: 'partnership_approved',
            title: '✅ Partnership Approved!',
            message: `Congratulations! Your partnership request has been approved. You are now a partner with Modern Furniture Pacific.`,
            read: false,
            createdAt: new Date().toISOString()
        };
        addItem('notifications', notification);

        console.log(`✅ Partnership approved for ${partnership.companyName}`);

        res.json({
            success: true,
            partnership: partnership,
            message: '✅ Partnership approved successfully!'
        });
    } catch (error) {
        console.error('❌ Approve partnership error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// REJECT PARTNERSHIP (Admin only)
// ============================================
exports.rejectPartnership = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || !isAdmin(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { id } = req.params;
        const { reason } = req.body;
        const partnerships = readData('partnerships') || [];
        const partnership = partnerships.find(p => p.id === id);

        if (!partnership) {
            return res.status(404).json({
                success: false,
                message: 'Partnership request not found'
            });
        }

        partnership.status = 'rejected';
        partnership.rejectedAt = new Date().toISOString();
        partnership.rejectedBy = req.user.id;
        partnership.rejectionReason = reason || 'No reason provided';
        partnership.updatedAt = new Date().toISOString();

        updateItem('partnerships', id, partnership);

        // Notify user
        const notification = {
            id: uuidv4(),
            userId: partnership.userId,
            type: 'partnership_rejected',
            title: '📋 Partnership Update',
            message: `Thank you for your interest in partnership. After review, we are unable to proceed at this time.\n\nReason: ${reason || 'No reason provided'}`,
            read: false,
            createdAt: new Date().toISOString()
        };
        addItem('notifications', notification);

        console.log(`❌ Partnership rejected for ${partnership.companyName}`);

        res.json({
            success: true,
            partnership: partnership,
            message: '✅ Partnership rejected. User has been notified.'
        });
    } catch (error) {
        console.error('❌ Reject partnership error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};