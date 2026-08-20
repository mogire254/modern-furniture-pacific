const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const scannerController = require('../controllers/scannerController');

// Public/User routes
router.get('/categories', scannerController.getCategories);

// User routes
router.post('/measure', protect, scannerController.submitMeasurement);
router.get('/my', protect, scannerController.getMyMeasurements);
router.get('/:id', protect, scannerController.getMeasurement);

// Admin routes
router.get('/', protect, isAdmin, scannerController.getMeasurements);
router.put('/:id/status', protect, isAdmin, scannerController.updateStatus);

module.exports = router;