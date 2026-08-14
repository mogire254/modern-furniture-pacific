const express = require('express');
const router = express.Router();
const { readData, addItem } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');

// @route   GET /api/orders
router.get('/', protect, (req, res) => {
  try {
    const orders = readData('orders');
    const userOrders = orders.filter(o => o.userId === req.user.id);
    res.json({
      success: true,
      orders: userOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/orders
router.post('/', protect, (req, res) => {
  try {
    const newOrder = {
      id: uuidv4(),
      userId: req.user.id,
      ...req.body,
      status: 'pending',
      isPaid: false,
      createdAt: new Date().toISOString()
    };
    addItem('orders', newOrder);
    res.status(201).json({
      success: true,
      order: newOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
