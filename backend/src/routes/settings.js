const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

// Public routes
router.get('/contact', settingsController.getContactInfo);
router.get('/about', settingsController.getAboutUs);

// Admin routes
router.put('/contact', protect, isAdmin, settingsController.updateContactInfo);
router.put('/about', protect, isAdmin, settingsController.updateAboutUs);

module.exports = router;