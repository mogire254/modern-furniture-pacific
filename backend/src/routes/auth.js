const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// ===== PUBLIC ROUTES =====
// Register (handles both users and admins)
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], authController.register);

// Login
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], authController.login);

// Forgot password
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Please enter a valid email')
], authController.forgotPassword);

// Reset password with token
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], authController.resetPasswordWithToken);

// ===== PROTECTED ROUTES =====
// Get current user
router.get('/me', protect, authController.getMe);

// Update profile
router.put('/profile', protect, authController.updateProfile);

// ===== CHANGE PASSWORD (for logged in user) - FIXED =====
router.post('/change-password', protect, authController.changePassword);

// Logout
router.post('/logout', protect, authController.logout);

module.exports = router;