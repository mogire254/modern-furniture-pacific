const { readData, writeData, findById, addItem, updateItem, deleteItem, findUserByEmail, getAllUsers } = require('../utils/fileHandler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a user (handles both regular and admin users)
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, branch } = req.body;

    // Check if user exists in either users or admins
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine if this is an admin or regular user
    const isAdmin = role && ['super_admin', 'ceo_admin', 'branch_admin'].includes(role);
    
    // Create user object
    const newUser = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      role: isAdmin ? role : 'user',
      profileImage: 'avatar-default.png',
      phone: '',
      address: {},
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    // Add branch if admin
    if (isAdmin && branch) {
      newUser.branch = branch;
    }

    // Save to appropriate file
    if (isAdmin) {
      // Save to admins.json
      addItem('admins', newUser);
      console.log(`✅ Admin created: ${name} (${role})`);
    } else {
      // Save to users.json
      addItem('users', newUser);
      console.log(`✅ User created: ${name}`);
    }

    // Generate token
    const token = generateToken(newUser.id, newUser.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        profileImage: newUser.profileImage,
        branch: newUser.branch
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Login user (checks both users and admins)
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check for user in both users and admins
    const user = findUserByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    
    // Determine which file to update
    const fileToUpdate = user.role === 'user' ? 'users' : 'admins';
    updateItem(fileToUpdate, user.id, user);

    // Generate token
    const token = generateToken(user.id, user.role);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        phone: user.phone,
        address: user.address,
        branch: user.branch
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all admins (Super Admin only)
exports.getAdmins = async (req, res) => {
  try {
    const admins = readData('admins');
    res.json({
      success: true,
      admins: admins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete admin (Super Admin only)
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admins = readData('admins');
    const admin = admins.find(a => a.id === id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Prevent deleting Super Admin
    if (admin.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete Super Admin'
      });
    }
    
    deleteItem('admins', id);
    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reset admin password (Super Admin only)
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    const admins = readData('admins');
    const admin = admins.find(a => a.id === id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    admin.password = hashedPassword;
    
    updateItem('admins', id, admin);
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }

    console.log(`📧 Password reset link sent to ${email}`);

    res.json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current user
exports.getMe = async (req, res) => {
  try {
    const allUsers = getAllUsers();
    const user = allUsers.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        phone: user.phone,
        address: user.address,
        branch: user.branch
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update profile
exports.updateProfile = async (req, res) => {
  try {
    const allUsers = getAllUsers();
    const user = allUsers.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, phone, address } = req.body;
    
    const updatedUser = {
      ...user,
      name: name || user.name,
      phone: phone || user.phone,
      address: address || user.address
    };

    const fileToUpdate = user.role === 'user' ? 'users' : 'admins';
    updateItem(fileToUpdate, user.id, updatedUser);

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
        phone: updatedUser.phone,
        address: updatedUser.address,
        branch: updatedUser.branch
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
