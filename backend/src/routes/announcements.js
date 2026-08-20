const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const announcementController = require('../controllers/announcementController');

// Public routes
router.get('/', announcementController.getAnnouncements);
router.get('/user', protect, announcementController.getUserAnnouncements);
router.get('/:id', announcementController.getAnnouncement);

// Admin routes
router.post('/', protect, isAdmin, announcementController.createAnnouncement);
router.put('/:id', protect, isAdmin, announcementController.updateAnnouncement);
router.delete('/:id', protect, isAdmin, announcementController.deleteAnnouncement);

module.exports = router;