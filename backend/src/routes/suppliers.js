const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const { readData, writeData, addItem, updateItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Submit supplier request (User)
router.post('/submit', protect, async (req, res) => {
    try {
        const { companyName, email, phone, materialType, quantity, description } = req.body;

        if (!companyName || !materialType) {
            return res.status(400).json({ success: false, message: 'Company name and material type are required' });
        }

        const supplier = {
            id: uuidv4(),
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            userPhone: req.user.phone || phone || '',
            companyName,
            email: email || req.user.email,
            phone: phone || req.user.phone || '',
            materialType,
            quantity: quantity || '',
            description: description || '',
            status: 'pending',
            branch: req.user.branch || 'all',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('suppliers', supplier);
        res.status(201).json({ success: true, supplier, message: 'Supplier request submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all suppliers (Admin only)
router.get('/', protect, isAdmin, async (req, res) => {
    try {
        const suppliers = readData('suppliers');
        res.json({ success: true, suppliers: suppliers || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Approve supplier (Admin only)
router.patch('/:id/approve', protect, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const supplier = findById('suppliers', id);
        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }
        supplier.status = 'approved';
        supplier.approvedAt = new Date().toISOString();
        supplier.approvedBy = req.user.id;
        updateItem('suppliers', id, supplier);
        res.json({ success: true, supplier, message: 'Supplier approved' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get user's suppliers
router.get('/my', protect, async (req, res) => {
    try {
        const suppliers = readData('suppliers');
        const userSuppliers = suppliers.filter(s => s.userId === req.user.id);
        res.json({ success: true, suppliers: userSuppliers || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;