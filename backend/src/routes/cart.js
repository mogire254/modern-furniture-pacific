const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const cartController = require('../controllers/cartController');

router.get('/', protect, cartController.getCart);
router.post('/add', protect, cartController.addToCart);
router.put('/:productId', protect, cartController.updateQuantity);
router.delete('/remove/:productId', protect, cartController.removeFromCart);
router.delete('/clear', protect, cartController.clearCart);
router.post('/transport', protect, cartController.setTransportCost);

module.exports = router;