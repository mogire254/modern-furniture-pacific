const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const { readData, writeData, addItem, updateItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Get user's conversations
router.get('/my', protect, async (req, res) => {
    try {
        const conversations = readData('customer-care');
        const userConversations = conversations.filter(c => c.userId === req.user.id);
        res.json({ success: true, messages: userConversations || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Send message
router.post('/send', protect, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const conversation = {
            id: uuidv4(),
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            message: message,
            sender: 'user',
            status: 'open',
            timestamp: new Date().toISOString(),
            read: false
        };

        addItem('customer-care', conversation);

        // Notify admins via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('new-customer-message', conversation);
        }

        res.status(201).json({ success: true, message: 'Message sent successfully', conversation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all conversations (Admin only)
router.get('/all', protect, isAdmin, async (req, res) => {
    try {
        const conversations = readData('customer-care');
        // Group by user
        const grouped = {};
        conversations.forEach(c => {
            if (!grouped[c.userId]) {
                grouped[c.userId] = {
                    userId: c.userId,
                    userName: c.userName,
                    userEmail: c.userEmail,
                    messages: [],
                    status: 'open',
                    lastMessage: c.timestamp
                };
            }
            grouped[c.userId].messages.push(c);
            if (c.timestamp > grouped[c.userId].lastMessage) {
                grouped[c.userId].lastMessage = c.timestamp;
            }
        });

        const result = Object.values(grouped);
        res.json({ success: true, conversations: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reply to conversation (Admin only)
router.post('/reply/:userId', protect, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // Get user info
        const users = readData('users');
        const admins = readData('admins');
        const allUsers = [...users, ...admins];
        const user = allUsers.find(u => u.id === userId);

        const reply = {
            id: uuidv4(),
            userId: userId,
            userName: user ? user.name : 'Customer',
            userEmail: user ? user.email : 'unknown',
            message: message,
            sender: 'admin',
            status: 'in-progress',
            timestamp: new Date().toISOString(),
            read: true
        };

        addItem('customer-care', reply);

        const io = req.app.get('io');
        if (io) {
            io.emit('admin-reply', reply);
        }

        res.json({ success: true, message: 'Reply sent successfully', reply });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Close conversation (Admin only)
router.patch('/close/:userId', protect, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const conversations = readData('customer-care');
        const userConversations = conversations.filter(c => c.userId === userId);
        userConversations.forEach(c => {
            c.status = 'closed';
            c.closedAt = new Date().toISOString();
        });
        writeData('customer-care', conversations);
        res.json({ success: true, message: 'Conversation closed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;