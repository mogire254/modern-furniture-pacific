const express = require('express');
const router = express.Router();
const { readData, writeData, addItem, findById } = require('../utils/fileHandler');
const { protect } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// ===== GET ALL CHAT MESSAGES =====
router.get('/', protect, (req, res) => {
    try {
        const messages = readData('chat');
        console.log('📥 Getting chat messages:', messages ? messages.length : 0);
        res.json({
            success: true,
            messages: messages || []
        });
    } catch (error) {
        console.error('❌ Error getting messages:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== SEND A MESSAGE =====
router.post('/', protect, (req, res) => {
    try {
        const { message, type, attachment, attachmentType, mentions } = req.body;
        
        // Get user info from the request (set by auth middleware)
        const senderId = req.user.id;
        const senderName = req.user.name || 'Unknown Admin';
        const senderRole = req.user.role || 'admin';
        
        console.log('📝 Sending message from:', senderName, '(', senderRole, ')');
        console.log('📝 Message:', message);
        
        // Check for @mentions in the message if not provided
        let finalMentions = mentions || [];
        if (!mentions || mentions.length === 0) {
            const mentionRegex = /@(\w+)/g;
            let match;
            while ((match = mentionRegex.exec(message)) !== null) {
                finalMentions.push(match[1]);
            }
        }
        
        const newMessage = {
            id: uuidv4(),
            senderId: senderId,
            senderName: senderName,
            senderRole: senderRole,
            message: message || '',
            type: type || 'text',
            attachment: attachment || null,
            attachmentType: attachmentType || null,
            mentions: finalMentions,
            timestamp: new Date().toISOString(),
            readBy: [senderId]
        };
        
        addItem('chat', newMessage);
        
        console.log('✅ Message saved successfully!');
        
        res.status(201).json({
            success: true,
            message: newMessage
        });
    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== MARK MESSAGE AS READ =====
router.put('/:id/read', protect, (req, res) => {
    try {
        const messages = readData('chat');
        const index = messages.findIndex(m => m.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        
        if (!messages[index].readBy.includes(req.user.id)) {
            messages[index].readBy.push(req.user.id);
            writeData('chat', messages);
        }
        
        res.json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== DELETE MESSAGE =====
router.delete('/:id', protect, (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only Super Admin can delete messages'
            });
        }
        
        const messages = readData('chat');
        const filtered = messages.filter(m => m.id !== req.params.id);
        writeData('chat', filtered);
        
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