const express = require('express');
const router = express.Router();
const { protect, isSuperAdmin } = require('../middleware/auth');
const { getAdmins, deleteAdmin, resetPassword } = require('../controllers/authController');

// Get all admins (Super Admin only)
router.get('/', protect, isSuperAdmin, getAdmins);

// Delete admin (Super Admin only)
router.delete('/:id', protect, isSuperAdmin, deleteAdmin);

// Reset admin password (Super Admin only)
router.put('/:id/reset-password', protect, isSuperAdmin, resetPassword);

module.exports = router;
