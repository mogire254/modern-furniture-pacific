const { readData, writeData, addItem, updateItem, deleteItem, findUserByEmail, findUserById, getAllUsers } = require('../utils/fileHandler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'modern-furniture-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '100y';

// Generate JWT Token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE
    });
};

// ===== REGISTER USER =====
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, branch, phone = '' } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        const existingUser = findUserByEmail(email);
        if (existingUser) {
            const isAdmin = ['super_admin', 'ceo_admin', 'branch_admin'].includes(existingUser.role);
            return res.status(400).json({
                success: false,
                message: isAdmin ? 'Admin already exists with this email' : 'User already exists with this email'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const isAdminRole = role && ['super_admin', 'ceo_admin', 'branch_admin'].includes(role);
        const userRole = isAdminRole ? role : 'user';

        const newUser = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            role: userRole,
            phone: phone || '',
            profileImage: 'avatar-default.png',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        if (isAdminRole && branch) {
            newUser.branch = branch;
        }

        const fileType = isAdminRole ? 'admins' : 'users';
        addItem(fileType, newUser);

        console.log(`✅ ${isAdminRole ? 'Admin' : 'User'} created: ${name} (${userRole})`);

        const token = generateToken(newUser.id, newUser.role);

        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            success: true,
            token,
            user: userWithoutPassword,
            message: isAdminRole ? 'Admin created successfully' : 'Registration successful'
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

// ===== LOGIN USER =====
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = findUserByEmail(email);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (user.isActive === false) {
            return res.status(401).json({
                success: false,
                message: 'Account deactivated. Please contact support.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        user.lastLogin = new Date().toISOString();
        const fileType = user.role === 'user' ? 'users' : 'admins';
        updateItem(fileType, user.id, user);

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

// ===== GET CURRENT USER =====
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

// ===== UPDATE PROFILE =====
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

// ===== FIXED: CHANGE PASSWORD =====
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        const user = findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        user.updatedAt = new Date().toISOString();

        const fileType = user.role === 'user' ? 'users' : 'admins';
        updateItem(fileType, user.id, user);

        console.log(`🔑 Password changed for user: ${user.name} (${user.email})`);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};

// ===== FORGOT PASSWORD =====
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

        const resetToken = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET + 'reset',
            { expiresIn: '1h' }
        );

        user.resetToken = resetToken;
        user.resetTokenExpiry = new Date(Date.now() + 3600000).toISOString();
        const fileType = user.role === 'user' ? 'users' : 'admins';
        updateItem(fileType, user.id, user);

        console.log(`📧 Password reset requested for ${email}`);
        console.log(`🔑 Reset token: ${resetToken}`);

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

// ===== RESET PASSWORD WITH TOKEN =====
exports.resetPasswordWithToken = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET + 'reset');
        const user = findUserById(decoded.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.resetToken !== token) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        if (new Date(user.resetTokenExpiry) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Reset token expired'
            });
        }

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

// ===== LOGOUT =====
exports.logout = async (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};