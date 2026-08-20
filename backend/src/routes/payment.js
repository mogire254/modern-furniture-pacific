const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Public webhook
router.post('/mpesa-callback', paymentController.mpesaCallback);

// User routes
router.post('/initiate', protect, paymentController.initiatePayment);
router.get('/my', protect, paymentController.getMyPayments);
router.get('/:id', protect, paymentController.verifyPayment);
router.post('/:id/retry', protect, paymentController.retryPayment);

// Admin routes
router.get('/', protect, isAdmin, paymentController.getPayments);

module.exports = router;