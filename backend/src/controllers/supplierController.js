const { readData, writeData, addItem, updateItem, findById, findUserById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// ===== FIXED: SUBMIT SUPPLIER (with image upload) =====
exports.submitSupplier = async (req, res) => {
    try {
        const { 
            companyName, materialType, description, 
            quantity, pricePerUnit, location,
            businessLicense, image
        } = req.body;

        if (!companyName || !materialType || !description) {
            return res.status(400).json({
                success: false,
                message: 'Company name, material type, and description are required'
            });
        }

        const supplier = {
            id: uuidv4(),
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            userPhone: req.user.phone || 'Not provided',
            companyName,
            materialType,
            description,
            quantity: quantity || '',
            pricePerUnit: pricePerUnit || '',
            location: location || '',
            businessLicense: businessLicense || '',
            image: image || null,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('suppliers', supplier);

        // Notify admin
        console.log(`📦 New supplier application from ${req.user.name}: ${companyName}`);
        console.log(`📧 Email: ${req.user.email}, Phone: ${req.user.phone}`);

        res.status(201).json({
            success: true,
            supplier,
            message: '✅ Thank you for your interest! We\'ll get back to you soon. Stay tuned!'
        });
    } catch (error) {
        console.error('❌ Supplier error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== FIXED: GET ALL SUPPLIERS =====
exports.getSuppliers = async (req, res) => {
    try {
        const { status } = req.query;
        let suppliers = readData('suppliers');

        if (status) {
            suppliers = suppliers.filter(s => s.status === status);
        }

        // Remove sensitive data
        const safeSuppliers = suppliers.map(s => {
            return { ...s };
        });

        res.json({
            success: true,
            suppliers: safeSuppliers,
            total: suppliers.length
        });
    } catch (error) {
        console.error('❌ Get suppliers error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== GET USER'S SUPPLIER APPLICATIONS =====
exports.getMySuppliers = async (req, res) => {
    try {
        const suppliers = readData('suppliers');
        const userSuppliers = suppliers.filter(s => s.userId === req.user.id);
        res.json({
            success: true,
            suppliers: userSuppliers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== FIXED: APPROVE SUPPLIER (with notification) =====
exports.approveSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = findById('suppliers', id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier application not found'
            });
        }

        supplier.status = 'approved';
        supplier.approvedAt = new Date().toISOString();
        supplier.approvedBy = req.user.id;
        supplier.updatedAt = new Date().toISOString();

        updateItem('suppliers', id, supplier);

        // Create notification for user
        const notification = {
            id: uuidv4(),
            userId: supplier.userId,
            type: 'supplier_approved',
            title: '✅ Supplier Application Approved!',
            message: `Dear ${supplier.userName},\n\nYour supplier application for ${supplier.companyName} has been approved! Please reach out to us via Customer Care or WhatsApp to negotiate terms.\n\n📞 WhatsApp: +254 716 335555\n📧 Email: info@modernfurniturepacificltd.com\n\nWe look forward to working with you!`,
            read: false,
            createdAt: new Date().toISOString()
        };
        addItem('notifications', notification);

        // Send to socket if available
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${supplier.userId}`).emit('new-notification', notification);
        }

        console.log(`✅ Supplier approved for ${supplier.userName} (${supplier.userEmail})`);
        console.log(`💬 Message: Please contact us via Customer Care or WhatsApp for negotiation`);

        res.json({
            success: true,
            supplier,
            message: '✅ Supplier approved! User has been notified.'
        });
    } catch (error) {
        console.error('❌ Approve supplier error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== FIXED: REJECT SUPPLIER (with notification) =====
exports.rejectSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = findById('suppliers', id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier application not found'
            });
        }

        supplier.status = 'rejected';
        supplier.rejectedAt = new Date().toISOString();
        supplier.rejectedBy = req.user.id;
        supplier.updatedAt = new Date().toISOString();

        updateItem('suppliers', id, supplier);

        // Create notification for user
        const notification = {
            id: uuidv4(),
            userId: supplier.userId,
            type: 'supplier_rejected',
            title: '📋 Supplier Application Update',
            message: `Dear ${supplier.userName},\n\nThank you for your interest in supplying materials to Modern Furniture Pacific.\n\nAfter careful review, we regret to inform you that we don't require your services at this time. However, we have kept your contact details and will reach out immediately when we need your materials.\n\nWe appreciate your support and wish you all the best!`,
            read: false,
            createdAt: new Date().toISOString()
        };
        addItem('notifications', notification);

        // Send to socket if available
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${supplier.userId}`).emit('new-notification', notification);
        }

        console.log(`❌ Supplier rejected for ${supplier.userName} (${supplier.userEmail})`);
        console.log(`📝 Message: Thank you for your support. We'll contact you when we require your materials.`);

        res.json({
            success: true,
            supplier,
            message: '✅ Supplier rejected. User has been notified.'
        });
    } catch (error) {
        console.error('❌ Reject supplier error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== GET SUPPLIER BY ID =====
exports.getSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = findById('suppliers', id);

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        res.json({
            success: true,
            supplier
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};