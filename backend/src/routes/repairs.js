const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const { readData, writeData, addItem, updateItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Submit repair request (User)
router.post('/submit', protect, async (req, res) => {
    try {
        const { productType, issue, description, preferredDate, location } = req.body;

        if (!productType || !issue) {
            return res.status(400).json({ success: false, message: 'Product type and issue are required' });
        }

        const repair = {
            id: uuidv4(),
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            userPhone: req.user.phone || '',
            productType,
            issue,
            description: description || '',
            preferredDate: preferredDate || null,
            location: location || '',
            status: 'pending',
            branch: req.user.branch || 'all',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('repairs', repair);
        res.status(201).json({ success: true, repair, message: 'Repair request submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all repairs (Admin only)
router.get('/', protect, isAdmin, async (req, res) => {
    try {
        const repairs = readData('repairs');
        res.json({ success: true, repairs: repairs || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update repair status (Admin only)
router.patch('/:id', protect, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const repair = findById('repairs', id);
        if (!repair) {
            return res.status(404).json({ success: false, message: 'Repair not found' });
        }
        repair.status = status;
        repair.updatedAt = new Date().toISOString();
        updateItem('repairs', id, repair);
        res.json({ success: true, repair, message: `Repair status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get user's repairs
router.get('/my', protect, async (req, res) => {
    try {
        const repairs = readData('repairs');
        const userRepairs = repairs.filter(r => r.userId === req.user.id);
        res.json({ success: true, repairs: userRepairs || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;