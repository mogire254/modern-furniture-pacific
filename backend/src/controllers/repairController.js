const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Submit repair request (User)
exports.submitRepair = async (req, res) => {
    try {
        const { 
            productType, issue, description, 
            preferredDate, preferredTime, location,
            phone, images = []
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
            userPhone: phone || req.user.phone || '',
            productType,
            issue,
            description: description || '',
            preferredDate: preferredDate || null,
            preferredTime: preferredTime || null,
            location: location || '',
            images: images || [],
            status: 'pending', // pending, in-progress, completed, cancelled
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
        if (status === 'in-progress') {
            console.log(`🔧 Repair in progress for ${repair.userName}. Quote: ${quote || 'TBD'}`);
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

// Cancel repair (User)
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