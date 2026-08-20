const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const repairController = require('../controllers/repairController');

// User routes
router.post('/submit', protect, repairController.submitRepair);
router.get('/my', protect, repairController.getMyRepairs);
router.get('/:id', protect, repairController.getRepair);
router.patch('/:id/cancel', protect, repairController.cancelRepair);

// Admin routes
router.get('/', protect, isAdmin, repairController.getRepairs);
router.put('/:id', protect, isAdmin, repairController.updateRepair);
router.put('/:id/payment', protect, isAdmin, repairController.updatePayment);

module.exports = router;