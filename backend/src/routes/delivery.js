const express = require('express');
const router = express.Router();
const { protect, isAdmin, isSuperAdmin } = require('../middleware/auth');
const deliveryController = require('../controllers/deliveryController');

// Public tracking
router.get('/track/:trackingNumber', deliveryController.trackDelivery);

// User routes
router.post('/create', protect, deliveryController.createDelivery);
router.get('/my', protect, deliveryController.getMyDeliveries);
router.get('/:id', protect, deliveryController.getDelivery);
router.post('/:id/confirm', protect, deliveryController.confirmDelivery);

// Admin routes
router.get('/', protect, isAdmin, deliveryController.getDeliveries);
router.put('/:id/status', protect, isAdmin, deliveryController.updateStatus);

// Super Admin routes
router.put('/:id/assign', protect, isSuperAdmin, deliveryController.assignDelivery);

module.exports = router;