const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const productController = require('../controllers/productController');

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeatured);
router.get('/category/:category', productController.getByCategory);
router.get('/:id', productController.getProduct);

// Protected routes (user)
router.post('/:productId/notify', protect, productController.requestNotification);

// Admin routes
router.post('/', protect, isAdmin, productController.createProduct);
router.put('/:id', protect, isAdmin, productController.updateProduct);
router.delete('/:id', protect, isAdmin, productController.deleteProduct);
router.put('/:id/status', protect, isAdmin, productController.updateStatus);

module.exports = router;