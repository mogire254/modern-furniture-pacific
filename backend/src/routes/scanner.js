const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const scannerController = require('../controllers/scannerController');

// User routes
router.post('/measure', protect, scannerController.submitMeasurement);
router.get('/my', protect, scannerController.getMyMeasurements);

// Admin routes
router.get('/', protect, isAdmin, scannerController.getMeasurements);
router.get('/:id', protect, isAdmin, scannerController.getMeasurement);
router.put('/:id/status', protect, isAdmin, scannerController.updateStatus);

module.exports = router;