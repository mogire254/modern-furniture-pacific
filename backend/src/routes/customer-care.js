const express = require('express');
const router = express.Router();
const { readData, writeData, addItem, findById, updateItem } = require('../utils/fileHandler');
const { protect } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// ===== GET ALL CUSTOMER CARE MESSAGES (Admin) =====
router.get('/', protect, (req, res) => {
    try {
        const messages = readData('customer-care');
        res.json({
            success: true,
            messages: messages || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== SEND CUSTOMER CARE MESSAGE (User) =====
router.post('/user', (req, res) => {
    try {
        const { name, email, phone, message, subject } = req.body;
        
        const newMessage = {
            id: uuidv4(),
            type: 'customer',
            name: name || 'Guest',
            email: email || '',
            phone: phone || '',
            subject: subject || 'General Inquiry',
            message: message || '',
            status: 'pending', // pending, replied, resolved
            adminResponse: '',
            respondedBy: '',
            respondedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        addItem('customer-care', newMessage);
        
        res.status(201).json({
            success: true,
            message: newMessage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== ADMIN REPLY TO CUSTOMER CARE =====
router.put('/:id/reply', protect, (req, res) => {
    try {
        const { response } = req.body;
        const messages = readData('customer-care');
        const index = messages.findIndex(m => m.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        
        messages[index].adminResponse = response;
        messages[index].status = 'replied';
        messages[index].respondedBy = req.user.name;
        messages[index].respondedAt = new Date().toISOString();
        messages[index].updatedAt = new Date().toISOString();
        
        writeData('customer-care', messages);
        
        res.json({
            success: true,
            message: messages[index]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== MARK AS RESOLVED =====
router.put('/:id/resolve', protect, (req, res) => {
    try {
        const messages = readData('customer-care');
        const index = messages.findIndex(m => m.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        
        messages[index].status = 'resolved';
        messages[index].updatedAt = new Date().toISOString();
        
        writeData('customer-care', messages);
        
        res.json({
            success: true,
            message: messages[index]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== DELETE CUSTOMER CARE MESSAGE (Admin) =====
router.delete('/:id', protect, (req, res) => {
    try {
        const messages = readData('customer-care');
        const filtered = messages.filter(m => m.id !== req.params.id);
        writeData('customer-care', filtered);
        
        res.json({
            success: true,
            message: 'Message deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
