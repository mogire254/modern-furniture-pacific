const express = require('express');
const router = express.Router();
const { readData, addItem } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');

// @route   POST /api/suppliers/request
router.post('/request', protect, (req, res) => {
  try {
    const request = {
      id: uuidv4(),
      userId: req.user.id,
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    addItem('suppliers', request);
    res.status(201).json({
      success: true,
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/suppliers
router.get('/', protect, (req, res) => {
  try {
    const suppliers = readData('suppliers');
    const userSuppliers = suppliers.filter(s => s.userId === req.user.id);
    res.json({
      success: true,
      suppliers: userSuppliers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
