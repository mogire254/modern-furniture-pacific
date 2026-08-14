const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/register
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], authController.register);

// @route   POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], authController.login);

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please enter a valid email')
], authController.forgotPassword);

// @route   GET /api/auth/me
router.get('/me', protect, authController.getMe);

// @route   PUT /api/auth/update-profile
router.put('/update-profile', protect, authController.updateProfile);

module.exports = router;
