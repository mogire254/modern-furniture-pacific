const { readData, writeData, addItem, updateItem, deleteItem, findUserById, findUserByEmail, getAllUsers, getStats, findById } = require('../utils/fileHandler');
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

// ===== CREATE ADMIN =====
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
                message: 'Email already in use'
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

// ===== DELETE ADMIN =====
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

// ===== UPDATE ADMIN =====
exports.updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, branch, phone, isActive } = req.body;

        const admins = readData('admins');
        const adminIndex = admins.findIndex(a => a.id === id);

        if (adminIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        if (admins[adminIndex].role === 'super_admin' && role && role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot change Super Admin role'
            });
        }

        const updatedAdmin = {
            ...admins[adminIndex],
            name: name || admins[adminIndex].name,
            role: role || admins[adminIndex].role,
            branch: branch !== undefined ? branch : admins[adminIndex].branch,
            phone: phone || admins[adminIndex].phone,
            isActive: isActive !== undefined ? isActive : admins[adminIndex].isActive,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
        };

        admins[adminIndex] = updatedAdmin;
        writeData('admins', admins);

        const { password, ...adminWithoutPassword } = updatedAdmin;
        res.json({
            success: true,
            admin: adminWithoutPassword,
            message: 'Admin updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== GET ALL USERS =====
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

// ===== GET USER BY ID =====
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = findUserById(id);
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
            message: error.message
        });
    }
};

// ===== UPDATE USER =====
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const user = findUserById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
        const fileType = user.role === 'user' ? 'users' : 'admins';
        updateItem(fileType, id, updatedUser);
        const { password, ...userWithoutPassword } = updatedUser;
        res.json({
            success: true,
            user: userWithoutPassword,
            message: 'User updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== DELETE USER =====
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = findUserById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (user.role === 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete Super Admin'
            });
        }
        const fileType = user.role === 'user' ? 'users' : 'admins';
        deleteItem(fileType, id);
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== GET BRANCHES =====
exports.getBranches = async (req, res) => {
    try {
        const admins = readData('admins');
        const branches = [];
        const branchMap = {};

        admins.forEach(admin => {
            if (admin.branch && admin.branch !== 'all') {
                if (!branchMap[admin.branch]) {
                    branchMap[admin.branch] = {
                        name: admin.branch,
                        manager: admin.name,
                        managerId: admin.id,
                        status: admin.isActive ? 'Active' : 'Inactive',
                        createdAt: admin.createdAt,
                        products: 0,
                        orders: 0
                    };
                }
            }
        });

        // Get product and order counts per branch
        const products = readData('products');
        const orders = readData('orders');
        Object.keys(branchMap).forEach(branch => {
            branchMap[branch].products = products.filter(p => p.branch === branch || p.branch === 'all').length;
            branchMap[branch].orders = orders.filter(o => o.branch === branch).length;
        });

        Object.values(branchMap).forEach(b => branches.push(b));
        res.json({
            success: true,
            branches,
            total: branches.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== CREATE BRANCH =====
exports.createBranch = async (req, res) => {
    try {
        const { branchName, managerEmail, location, phone } = req.body;

        if (!branchName || !managerEmail) {
            return res.status(400).json({
                success: false,
                message: 'Branch name and manager email are required'
            });
        }

        const manager = findUserByEmail(managerEmail);
        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }

        if (manager.branch && manager.branch !== 'all') {
            return res.status(400).json({
                success: false,
                message: 'Manager already assigned to a branch'
            });
        }

        manager.branch = branchName;
        const fileType = manager.role === 'user' ? 'users' : 'admins';
        updateItem(fileType, manager.id, manager);

        const branchData = {
            id: uuidv4(),
            name: branchName,
            managerId: manager.id,
            managerName: manager.name,
            location: location || '',
            phone: phone || '',
            createdAt: new Date().toISOString(),
            status: 'Active'
        };
        addItem('branches', branchData);

        res.json({
            success: true,
            message: `Branch ${branchName} created successfully`,
            branch: branchData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== DELETE BRANCH =====
exports.deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;
        deleteItem('branches', id);
        res.json({
            success: true,
            message: 'Branch deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== TOGGLE MAINTENANCE =====
exports.toggleMaintenance = async (req, res) => {
    try {
        const { enabled } = req.body;
        const settings = readData('settings');
        settings.maintenance = {
            enabled: enabled,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
        };
        writeData('settings', settings);

        res.json({
            success: true,
            message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
            maintenance: settings.maintenance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== GET MAINTENANCE STATUS =====
exports.getMaintenanceStatus = async (req, res) => {
    try {
        const settings = readData('settings');
        res.json({
            success: true,
            maintenance: settings.maintenance || { enabled: false }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== GET DASHBOARD STATS =====
exports.getDashboardStats = async (req, res) => {
    try {
        const stats = getStats();
        
        // Get real-time data
        const users = readData('users');
        const admins = readData('admins');
        const products = readData('products');
        const orders = readData('orders');
        const applications = readData('applications');
        const repairs = readData('repairs');
        const suppliers = readData('suppliers');
        const payments = readData('payments');
        const deliveries = readData('deliveries');
        const reviews = readData('reviews');
        
        const allUsers = [...users, ...admins];
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const completedOrders = orders.filter(o => o.status === 'completed').length;
        const pendingApplications = applications.filter(a => a.status === 'pending').length;
        const pendingRepairs = repairs.filter(r => r.status === 'pending').length;

        res.json({
            success: true,
            stats: {
                totalUsers: allUsers.length,
                totalAdmins: admins.length,
                totalProducts: products.length,
                totalOrders: orders.length,
                totalApplications: applications.length,
                totalRepairs: repairs.length,
                totalSuppliers: suppliers.length,
                totalPayments: payments.length,
                totalDeliveries: deliveries.length,
                totalReviews: reviews.length,
                totalRevenue,
                pendingOrders,
                completedOrders,
                pendingApplications,
                pendingRepairs,
                activeUsers: allUsers.filter(u => u.isActive !== false).length,
                activeAdmins: admins.filter(a => a.isActive !== false).length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== GET RECENT ACTIVITY =====
exports.getRecentActivity = async (req, res) => {
    try {
        const orders = readData('orders');
        const applications = readData('applications');
        const repairs = readData('repairs');
        const suppliers = readData('suppliers');
        
        const activities = [];
        
        // Add recent orders
        orders.slice(0, 5).forEach(o => {
            activities.push({
                type: 'order',
                id: o.id,
                user: o.userName || 'User',
                action: `Placed order #${o.id.slice(0, 8)}`,
                status: o.status || 'pending',
                timestamp: o.createdAt || new Date().toISOString(),
                amount: o.total || 0
            });
        });
        
        // Add recent applications
        applications.slice(0, 5).forEach(a => {
            activities.push({
                type: 'application',
                id: a.id,
                user: a.userName || 'Applicant',
                action: `Applied for position: ${a.position || 'Job'}`,
                status: a.status || 'pending',
                timestamp: a.createdAt || new Date().toISOString()
            });
        });
        
        // Add recent repairs
        repairs.slice(0, 5).forEach(r => {
            activities.push({
                type: 'repair',
                id: r.id,
                user: r.userName || 'Customer',
                action: `Requested repair: ${r.issue || 'Repair'}`,
                status: r.status || 'pending',
                timestamp: r.createdAt || new Date().toISOString()
            });
        });
        
        // Sort by timestamp (newest first)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({
            success: true,
            activities: activities.slice(0, 20)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ===== RESET ADMIN PASSWORD =====
exports.resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        const user = findUserById(id);
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
        updateItem(fileType, id, user);

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