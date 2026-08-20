const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const { readData, writeData, addItem, updateItem, getAllUsers } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Get chat history
router.get('/history', protect, isAdmin, async (req, res) => {
    try {
        const { userId } = req.query;
        const chatHistory = readData('admin-chat');
        
        let messages = chatHistory;
        if (userId) {
            messages = chatHistory.filter(m => 
                (m.fromAdminId === req.user.id && m.toAdminId === userId) ||
                (m.fromAdminId === userId && m.toAdminId === req.user.id) ||
                (m.toAdminId === 'all')
            );
        }

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all admins for chat
router.get('/admins', protect, isAdmin, async (req, res) => {
    try {
        const allUsers = getAllUsers();
        const admins = allUsers.filter(u => u.isAdmin || ['super_admin', 'ceo_admin', 'branch_admin'].includes(u.role));
        
        // Get online status and unread counts
        const chatHistory = readData('admin-chat');
        const adminList = admins.map(admin => {
            const unread = chatHistory.filter(m => 
                m.toAdminId === req.user.id && 
                m.fromAdminId === admin.id && 
                !m.read
            ).length;
            
            return {
                ...admin,
                unread,
                isOnline: false // Will be updated via socket
            };
        });

        res.json({
            success: true,
            admins: adminList
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mark messages as read
router.put('/read/:messageId', protect, isAdmin, async (req, res) => {
    try {
        const { messageId } = req.params;
        const chatHistory = readData('admin-chat');
        const messageIndex = chatHistory.findIndex(m => m.id === messageId);
        
        if (messageIndex !== -1) {
            chatHistory[messageIndex].read = true;
            chatHistory[messageIndex].readAt = new Date().toISOString();
            writeData('admin-chat', chatHistory);
            
            res.json({
                success: true,
                message: 'Message marked as read'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;