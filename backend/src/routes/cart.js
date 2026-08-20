const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const cartController = require('../controllers/cartController');

// Get cart
router.get('/', protect, cartController.getCart);

// Add to cart
router.post('/add', protect, cartController.addToCart);

// Remove from cart
router.delete('/remove/:productId', protect, cartController.removeFromCart);

// Clear cart
router.delete('/clear', protect, cartController.clearCart);

module.exports = router;