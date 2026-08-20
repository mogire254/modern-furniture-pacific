const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const supplierController = require('../controllers/supplierController');

// User routes
router.post('/submit', protect, supplierController.submitSupplier);
router.get('/my', protect, supplierController.getMySuppliers);

// Admin routes
router.get('/', protect, isAdmin, supplierController.getSuppliers);
router.get('/:id', protect, isAdmin, supplierController.getSupplier);
router.patch('/:id/approve', protect, isAdmin, supplierController.approveSupplier);
router.patch('/:id/reject', protect, isAdmin, supplierController.rejectSupplier);

module.exports = router;