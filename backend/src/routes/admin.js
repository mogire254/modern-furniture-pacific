const express = require('express');
const router = express.Router();
const { protect, isSuperAdmin, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Super Admin only routes
router.get('/', protect, isSuperAdmin, adminController.getAdmins);
router.post('/create', protect, isSuperAdmin, adminController.createAdmin);
router.delete('/:id', protect, isSuperAdmin, adminController.deleteAdmin);
router.put('/:id', protect, isSuperAdmin, adminController.updateAdmin);

// User management
router.get('/users', protect, isSuperAdmin, adminController.getAllUsers);

// Branch management
router.get('/branches', protect, isSuperAdmin, adminController.getBranches);
router.post('/branches', protect, isSuperAdmin, adminController.createBranch);
router.delete('/branches/:id', protect, isSuperAdmin, adminController.deleteBranch);

// Maintenance
router.post('/maintenance', protect, isSuperAdmin, adminController.toggleMaintenance);
router.get('/maintenance', protect, isSuperAdmin, adminController.getMaintenanceStatus);

// Dashboard stats (any admin)
router.get('/stats', protect, isAdmin, adminController.getDashboardStats);

module.exports = router;