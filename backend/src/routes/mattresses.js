const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const mattressController = require('../controllers/mattressController');

// ============================================
// PUBLIC ROUTES
// ============================================
router.get('/', mattressController.getMattresses);
router.get('/categories', mattressController.getCategories);
router.get('/:id', mattressController.getMattress);

// ============================================
// ADMIN ROUTES
// ============================================
router.post('/', protect, isAdmin, mattressController.createMattress);
router.put('/:id', protect, isAdmin, mattressController.updateMattress);
router.delete('/:id', protect, isAdmin, mattressController.deleteMattress);
router.patch('/:id/status', protect, isAdmin, mattressController.toggleStatus);

module.exports = router;