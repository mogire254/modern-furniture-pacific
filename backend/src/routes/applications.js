const express = require('express');
const router = express.Router();
const { protect, isAdmin, isCEOAdmin } = require('../middleware/auth');
const applicationController = require('../controllers/applicationController');

// Public routes
router.get('/settings', applicationController.getSettings);

// User routes
router.post('/submit', protect, applicationController.submitApplication);
router.get('/my', protect, applicationController.getMyApplications);

// Admin routes
router.get('/', protect, isAdmin, applicationController.getApplications);
router.put('/settings', protect, isCEOAdmin, applicationController.updateSettings);
router.put('/:id/status', protect, isAdmin, applicationController.updateStatus);

module.exports = router;