const { readData, writeData, addItem, updateItem, deleteItem, findUserById, findUserByEmail, getStats } = require('../utils/fileHandler');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ===== GET ALL ADMINS =====
exports.getAdmins = async (req, res) => {
    try {
        const admins = readData('admins');
        const safeAdmins = admins.map(({ password, ...admin }) => admin);
        res.json({
            success: true,
            admins: safeAdmins,
            total: safeAdmins.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== CREATE ADMIN (Super Admin only) =====
exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password, role, branch, phone = '' } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, password, and role are required'
            });
        }

        const validRoles = ['super_admin', 'ceo_admin', 'branch_admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be super_admin, ceo_admin, or branch_admin'
            });
        }

        const existing = findUserByEmail(email);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Admin already exists with this email'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            role: role,
            branch: branch || 'all',
            phone,
            profileImage: 'avatar-default.png',
            isActive: true,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            createdBy: req.user.id
        };

        addItem('admins', newAdmin);

        const { password: _, ...adminWithoutPassword } = newAdmin;
        res.status(201).json({
            success: true,
            admin: adminWithoutPassword,
            message: `Admin created successfully as ${role}`
        });
    } catch (error) {
        console.error('❌ Create admin error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== FIXED: DELETE ADMIN =====
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
        console.error('❌ Delete admin error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== FIXED: RESET ADMIN PASSWORD (Super Admin only) =====
exports.resetAdminPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            });
        }

        const admins = readData('admins');
        const admin = admins.find(a => a.id === id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Prevent resetting Super Admin password (except by super admin themselves)
        // But since this route is only for super admin, allow it for all

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        admin.password = hashedPassword;
        admin.updatedAt = new Date().toISOString();

        updateItem('admins', id, admin);

        console.log(`🔑 Password reset for admin: ${admin.name} (${admin.email})`);

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== GET ALL USERS (Super Admin only) =====
exports.getAllUsers = async (req, res) => {
    try {
        const users = readData('users');
        const admins = readData('admins');
        const allUsers = [...users, ...admins].map(({ password, ...user }) => user);
        res.json({
            success: true,
            users: allUsers,
            total: allUsers.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== GET DASHBOARD STATS (Admin only) =====
exports.getDashboardStats = async (req, res) => {
    try {
        const stats = getStats();
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};