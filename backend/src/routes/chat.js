const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Chat routes will be handled via Socket.io
// This file is just for HTTP endpoints if needed

// Get chat history (HTTP fallback)
router.get('/history/:userId', protect, (req, res) => {
    const { readData } = require('../utils/fileHandler');
    const chatHistory = readData('customer-care');
    const messages = chatHistory.filter(m => 
        m.fromUserId === req.params.userId || 
        m.toUserId === req.params.userId
    );
    res.json({
        success: true,
        messages
    });
});

module.exports = router;