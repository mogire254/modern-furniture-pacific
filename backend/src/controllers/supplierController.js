const { readData, writeData, addItem, updateItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Submit supplier application
exports.submitSupplier = async (req, res) => {
    try {
        const { 
            companyName, materialType, description, 
            quantity, pricePerUnit, location,
            businessLicense
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
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('suppliers', supplier);

        // Notify admin
        console.log(`📦 New supplier application from ${req.user.name}: ${companyName}`);

        res.status(201).json({
            success: true,
            supplier,
            message: 'Supplier application submitted successfully'
        });
    } catch (error) {
        console.error('❌ Supplier error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all suppliers (Admin only)
exports.getSuppliers = async (req, res) => {
    try {
        const { status } = req.query;
        let suppliers = readData('suppliers');

        if (status) {
            suppliers = suppliers.filter(s => s.status === status);
        }

        res.json({
            success: true,
            suppliers,
            total: suppliers.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user's supplier applications
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

// Update supplier status (Admin only)
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, feedback } = req.body;

        const supplier = findById('suppliers', id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier application not found'
            });
        }

        supplier.status = status;
        supplier.feedback = feedback || '';
        supplier.updatedAt = new Date().toISOString();
        supplier.reviewedBy = req.user.id;

        updateItem('suppliers', id, supplier);

        // Prepare response message based on status
        let message = '';
        if (status === 'accepted') {
            message = `🎉 Congratulations! Your supplier application has been accepted. Our team will contact you at ${supplier.userEmail} and ${supplier.userPhone}. You can also reach us via live chat for immediate questions.`;
        } else if (status === 'declined') {
            message = `Thank you for your interest in supplying Modern Pacific Furniture. We will contact you when we need your materials. You can reach us at info@modernfurniturepacificltd.com or chat with us live.`;
        }

        res.json({
            success: true,
            supplier,
            message: message || `Supplier status updated to ${status}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get supplier by ID
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