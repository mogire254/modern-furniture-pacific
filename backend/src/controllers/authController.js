const { readData, writeData, addItem, updateItem, findUserByEmail, findUserById, getAllUsers } = require('../utils/fileHandler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'modern-furniture-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Generate JWT Token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE
    });
};

// Register user
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone = '', address = {} } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Check if user exists
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

        // Create user
        const newUser = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            role: 'user',
            phone,
            address,
            profileImage: 'avatar-default.png',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        addItem('users', newUser);

        // Generate token
        const token = generateToken(newUser.id, newUser.role);

        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            success: true,
            token,
            user: userWithoutPassword,
            message: 'Registration successful'
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user (searches both users and admins)
        const user = findUserByEmail(email);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if active
        if (user.isActive === false) {
            return res.status(401).json({
                success: false,
                message: 'Account deactivated. Please contact support at info@modernfurniturepacificltd.com'
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
        const fileType = user.role === 'user' ? 'users' : 'admins';
        updateItem(fileType, user.id, user);

        // Generate token
        const token = generateToken(user.id, user.role);

        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            token,
            user: userWithoutPassword,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

// Get current user
exports.getMe = async (req, res) => {
    try {
        const user = findUserById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { password, ...userWithoutPassword } = user;
        res.json({
            success: true,
            user: userWithoutPassword
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, address, profileImage } = req.body;
        const user = findUserById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const updatedUser = {
            ...user,
            name: name || user.name,
            phone: phone || user.phone,
            address: address || user.address,
            profileImage: profileImage || user.profileImage,
            updatedAt: new Date().toISOString()
        };

        const fileType = user.role === 'user' ? 'users' : 'admins';
        updateItem(fileType, user.id, updatedUser);

        const { password, ...userWithoutPassword } = updatedUser;
        res.json({
            success: true,
            user: userWithoutPassword,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Update failed',
            error: error.message
        });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = findUserByEmail(email);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this email'
            });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET + 'reset',
            { expiresIn: '1h' }
        );

        // Save reset token
        user.resetToken = resetToken;
        user.resetTokenExpiry = new Date(Date.now() + 3600000).toISOString();
        const fileType = user.role === 'user' ? 'users' : 'admins';
        updateItem(fileType, user.id, user);

        // Send email with reset link (implement email service)
        console.log(`📧 Password reset requested for ${email}`);
        console.log(`🔑 Reset token: ${resetToken}`);
        console.log(`🔗 Reset link: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);

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

// Reset password with token
exports.resetPasswordWithToken = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET + 'reset');
        const user = findUserById(decoded.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if token matches
        if (user.resetToken !== token) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        // Check if token expired
        if (new Date(user.resetTokenExpiry) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Reset token expired'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;

        const fileType = user.role === 'user' ? 'users' : 'admins';
        updateItem(fileType, user.id, user);

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: error.message
        });
    }
};

// Reset password (admin)
exports.resetPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        const user = findUserById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;

        const fileType = user.role === 'user' ? 'users' : 'admins';
        updateItem(fileType, user.id, user);

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: error.message
        });
    }
};

// Logout (client side will remove token)
exports.logout = async (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};