const express = require('express');
const router = express.Router();
const { protect, isSuperAdmin, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// ============================================
// SUPER ADMIN ONLY ROUTES
// ============================================

// Get all admins
router.get('/', protect, isSuperAdmin, adminController.getAdmins);

// Create new admin (CEO or Branch)
router.post('/create', protect, isSuperAdmin, adminController.createAdmin);

// ===== FIXED: Delete Admin =====
router.delete('/:id', protect, isSuperAdmin, adminController.deleteAdmin);

// ===== FIXED: Reset Admin Password =====
router.put('/:id/reset-password', protect, isSuperAdmin, adminController.resetAdminPassword);

// Get all users (Super Admin only)
router.get('/users', protect, isSuperAdmin, adminController.getAllUsers);

// ============================================
// ANY ADMIN ROUTES
// ============================================

// Dashboard stats (any admin)
router.get('/stats', protect, isAdmin, adminController.getDashboardStats);

module.exports = router;