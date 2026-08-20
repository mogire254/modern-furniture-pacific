const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const statsController = require('../controllers/statsController');

// Public stats (limited)
router.get('/', statsController.getStats);

// Admin stats
router.get('/admin', protect, isAdmin, statsController.getAdminStats);
router.get('/branch/:branch', protect, isAdmin, statsController.getBranchStats);

module.exports = router;