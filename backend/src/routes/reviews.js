const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// User routes
router.post('/submit', protect, reviewController.submitReview);
router.get('/my', protect, reviewController.getMyReviews);
router.post('/:id/like', protect, reviewController.likeReview);

// Admin routes
router.get('/', protect, isAdmin, reviewController.getReviews);
router.patch('/:id/approve', protect, isAdmin, reviewController.approveReview);
router.patch('/:id/reject', protect, isAdmin, reviewController.rejectReview);
router.delete('/:id', protect, isAdmin, reviewController.deleteReview);

module.exports = router;