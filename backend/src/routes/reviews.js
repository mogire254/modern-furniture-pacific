const express = require('express');
const router = express.Router();
const { readData, findById, addItem, updateItem } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');

// @route   GET /api/reviews/:productId
router.get('/:productId', (req, res) => {
  try {
    const reviews = readData('reviews');
    const productReviews = reviews.filter(r => r.productId === req.params.productId);
    res.json({
      success: true,
      reviews: productReviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/reviews
router.post('/', protect, (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    
    const product = findById('products', productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const review = {
      id: uuidv4(),
      userId: req.user.id,
      productId,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    addItem('reviews', review);

    // Update product rating
    const reviews = readData('reviews');
    const productReviews = reviews.filter(r => r.productId === productId);
    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    
    product.rating = Math.round(avgRating * 10) / 10;
    product.numReviews = productReviews.length;
    updateItem('products', productId, product);

    res.status(201).json({
      success: true,
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
