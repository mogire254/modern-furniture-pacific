const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// Create order
router.post('/create', protect, orderController.createOrder);

// Get user's orders
router.get('/my', protect, orderController.getMyOrders);

// Get all orders (Admin only)
router.get('/', protect, isAdmin, orderController.getAllOrders);

// Update order status (Admin only)
router.patch('/:id/status', protect, isAdmin, orderController.updateOrderStatus);

// Update payment status (Admin only)
router.patch('/:id/payment', protect, isAdmin, orderController.updatePaymentStatus);

// Cancel order
router.patch('/:id/cancel', protect, orderController.cancelOrder);

module.exports = router;