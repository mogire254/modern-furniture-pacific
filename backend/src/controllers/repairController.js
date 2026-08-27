const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// ===== FIXED: SUBMIT REPAIR (with image upload) =====
exports.submitRepair = async (req, res) => {
    try {
        const { 
            productType, issue, description, 
            preferredDate, preferredTime, location,
            phone, image
        } = req.body;

        // FIXED: Better validation
        if (!productType || productType === '') {
            return res.status(400).json({
                success: false,
                message: 'Please select an item type'
            });
        }
        
        if (!issue || issue.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Please describe the issue'
            });
        }
        
        if (!description || description.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Please provide a detailed description'
            });
        }

        const repair = {
            id: uuidv4(),
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            userPhone: phone || req.user.phone || '',
            productType,
            issue: issue.trim(),
            description: description.trim(),
            preferredDate: preferredDate || null,
            preferredTime: preferredTime || null,
            location: location || '',
            image: image || null,
            status: 'pending',
            branch: req.user.branch || 'all',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('repairs', repair);

        // Notify admin
        console.log(`🔧 New repair request from ${req.user.name}: ${productType} - ${issue}`);
        console.log(`📧 User: ${req.user.email}, Phone: ${repair.userPhone}`);

        res.status(201).json({
            success: true,
            repair,
            message: '✅ Thank you for contacting us! If you need immediate assistance, chat with us via Customer Care in your menu. Thanks again for contacting us!'
        });
    } catch (error) {
        console.error('❌ Repair error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== GET ALL REPAIRS (Admin) =====
exports.getRepairs = async (req, res) => {
    try {
        const { status } = req.query;
        let repairs = readData('repairs');

        if (status) {
            repairs = repairs.filter(r => r.status === status);
        }

        res.json({
            success: true,
            repairs,
            total: repairs.length
        });
    } catch (error) {
        console.error('❌ Get repairs error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== GET USER'S REPAIRS =====
exports.getMyRepairs = async (req, res) => {
    try {
        const repairs = readData('repairs');
        const userRepairs = repairs.filter(r => r.userId === req.user.id);
        res.json({
            success: true,
            repairs: userRepairs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== GET REPAIR BY ID =====
exports.getRepair = async (req, res) => {
    try {
        const { id } = req.params;
        const repair = findById('repairs', id);

        if (!repair) {
            return res.status(404).json({
                success: false,
                message: 'Repair not found'
            });
        }

        if (repair.userId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            repair
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== FIXED: UPDATE REPAIR (with approve/reject) =====
exports.updateRepair = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            status, quote, cost, 
            paymentStatus, renovatorName,
            renovatorPhone, notes
        } = req.body;

        const repair = findById('repairs', id);
        if (!repair) {
            return res.status(404).json({
                success: false,
                message: 'Repair not found'
            });
        }

        const updates = {
            status: status || repair.status,
            quote: quote || repair.quote,
            cost: cost || repair.cost,
            paymentStatus: paymentStatus || repair.paymentStatus,
            renovatorName: renovatorName || repair.renovatorName,
            renovatorPhone: renovatorPhone || repair.renovatorPhone,
            notes: notes || repair.notes,
            updatedAt: new Date().toISOString(),
            reviewedBy: req.user.id
        };

        updateItem('repairs', id, updates);

        // If status changed to approved/confirmed, notify user
        if (status === 'approved' || status === 'confirmed') {
            const notification = {
                id: uuidv4(),
                userId: repair.userId,
                type: 'repair_approved',
                title: '🔧 Repair Request Confirmed',
                message: `Dear ${repair.userName},\n\nYour repair request for ${repair.productType} has been confirmed!\n\nWe will contact you shortly to schedule the repair. If you have any questions, please reach out via Customer Care.\n\n📞 WhatsApp: +254 716 335555\n📧 Email: info@modernfurniturepacificltd.com`,
                read: false,
                createdAt: new Date().toISOString()
            };
            addItem('notifications', notification);
            
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${repair.userId}`).emit('new-notification', notification);
            }
        }

        // If status changed to rejected
        if (status === 'rejected') {
            const notification = {
                id: uuidv4(),
                userId: repair.userId,
                type: 'repair_rejected',
                title: '🔧 Repair Request Update',
                message: `Dear ${repair.userName},\n\nThank you for your repair request. After review, we regret to inform you that we cannot proceed with this repair at this time.\n\nIf you have any questions, please reach out via Customer Care.\n\n📞 WhatsApp: +254 716 335555\n📧 Email: info@modernfurniturepacificltd.com`,
                read: false,
                createdAt: new Date().toISOString()
            };
            addItem('notifications', notification);
            
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${repair.userId}`).emit('new-notification', notification);
            }
        }

        console.log(`🔧 Repair ${status} for ${repair.userName}`);

        res.json({
            success: true,
            repair: { ...repair, ...updates },
            message: `Repair ${status} successfully`
        });
    } catch (error) {
        console.error('❌ Update repair error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== UPDATE PAYMENT STATUS =====
exports.updatePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus, amount } = req.body;

        const repair = findById('repairs', id);
        if (!repair) {
            return res.status(404).json({
                success: false,
                message: 'Repair not found'
            });
        }

        repair.paymentStatus = paymentStatus;
        repair.amount = amount || repair.amount;
        repair.updatedAt = new Date().toISOString();

        updateItem('repairs', id, repair);

        res.json({
            success: true,
            repair,
            message: `Payment status updated to ${paymentStatus}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== CANCEL REPAIR =====
exports.cancelRepair = async (req, res) => {
    try {
        const { id } = req.params;
        const repair = findById('repairs', id);

        if (!repair) {
            return res.status(404).json({
                success: false,
                message: 'Repair not found'
            });
        }

        if (repair.userId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (repair.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel completed repair'
            });
        }

        repair.status = 'cancelled';
        repair.updatedAt = new Date().toISOString();

        updateItem('repairs', id, repair);

        res.json({
            success: true,
            repair,
            message: 'Repair cancelled successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};