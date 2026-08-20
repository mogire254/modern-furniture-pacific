const { readData, writeData, addItem, updateItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Submit supplier application (User)
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

// Approve supplier (Admin only)
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

        // Send notification to user
        console.log(`📧 Supplier approved for ${supplier.userName} (${supplier.userEmail})`);
        console.log(`📞 Contact: ${supplier.userPhone}`);
        console.log(`💬 Message: Please contact us via Customer Care or WhatsApp for negotiation`);

        res.json({
            success: true,
            supplier,
            message: '✅ Supplier approved! Contact info sent to user.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Reject supplier (Admin only)
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

        // Send notification to user
        console.log(`📧 Supplier rejected for ${supplier.userName} (${supplier.userEmail})`);
        console.log(`📝 Message: Thank you for your support. We'll contact you when we require your materials.`);

        res.json({
            success: true,
            supplier,
            message: '✅ Supplier rejected. Thank you for your support. We\'ll contact you when we require your materials.'
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