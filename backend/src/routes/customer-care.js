const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const customerCareController = require('../controllers/customerCareController');

// User routes
router.get('/my', protect, customerCareController.getMyMessages);
router.post('/send', protect, customerCareController.sendMessage);

// Admin routes
router.get('/all', protect, isAdmin, customerCareController.getAllConversations);
router.get('/search', protect, isAdmin, customerCareController.searchConversations);
router.get('/user/:userId', protect, isAdmin, customerCareController.getUserConversation);
router.post('/reply/:userId', protect, isAdmin, customerCareController.replyToConversation);
router.post('/start/:userId', protect, isAdmin, customerCareController.startChat);
router.patch('/close/:userId', protect, isAdmin, customerCareController.closeConversation);

module.exports = router;