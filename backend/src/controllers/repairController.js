const { readData, writeData, addItem, updateItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Submit repair request
exports.submitRepair = async (req, res) => {
    try {
        const { 
            productType, issue, description, 
            urgency, preferredDate, images = []
        } = req.body;

        if (!productType || !issue || !description) {
            return res.status(400).json({
                success: false,
                message: 'Product type, issue, and description are required'
            });
        }

        const repair = {
            id: uuidv4(),
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            userPhone: req.user.phone || 'Not provided',
            productType,
            issue,
            description,
            urgency: urgency || 'normal',
            preferredDate: preferredDate || null,
            images: images,
            status: 'pending',
            quote: null,
            cost: null,
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('repairs', repair);

        console.log(`🔧 New repair request from ${req.user.name}: ${productType} - ${issue}`);

        res.status(201).json({
            success: true,
            repair,
            message: '✅ Thank you for contacting us! Our repair team will reach out within 24 hours. For immediate assistance, call 0716 335555 or use our live chat.'
        });
    } catch (error) {
        console.error('❌ Repair error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all repairs (Admin only)
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user's repairs
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

// Get repair by ID
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

        // Check if user owns this repair or is admin
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

// Update repair (Admin only)
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

        // Send notification based on status
        if (status === 'accepted') {
            console.log(`✅ Repair accepted for ${repair.userName}. Quote: ${quote || 'TBD'}`);
        } else if (status === 'completed') {
            console.log(`✅ Repair completed for ${repair.userName}`);
        }

        res.json({
            success: true,
            repair: { ...repair, ...updates },
            message: 'Repair updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update payment status (Admin only)
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