const { readData, getStats } = require('../utils/fileHandler');

// Get dashboard stats
exports.getStats = async (req, res) => {
    try {
        const stats = getStats();
        
        // Add user-specific stats
        if (req.user) {
            const users = readData('users');
            const orders = readData('orders');
            const repairs = readData('repairs');
            const applications = readData('applications');
            
            // User-specific stats
            stats.userStats = {
                totalOrders: orders.filter(o => o.userId === req.user.id).length,
                totalRepairs: repairs.filter(r => r.userId === req.user.id).length,
                totalApplications: applications.filter(a => a.userId === req.user.id).length
            };
        }

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

// Get admin-specific stats
exports.getAdminStats = async (req, res) => {
    try {
        const stats = getStats();
        
        // Add admin-specific stats
        const orders = readData('orders');
        const payments = readData('payments');
        const deliveries = readData('deliveries');
        
        stats.adminStats = {
            totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            completedOrders: orders.filter(o => o.status === 'completed').length,
            totalPayments: payments.length,
            pendingDeliveries: deliveries.filter(d => d.status === 'pending').length,
            completedDeliveries: deliveries.filter(d => d.status === 'delivered').length,
            revenueByMonth: getRevenueByMonth(orders)
        };

        res.json({
            success: true,
            stats: stats.adminStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get revenue by month
function getRevenueByMonth(orders) {
    const months = {};
    orders.forEach(order => {
        if (order.createdAt && order.status === 'completed') {
            const date = new Date(order.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months[monthKey] = (months[monthKey] || 0) + (order.total || 0);
        }
    });
    return months;
}

// Get branch-specific stats
exports.getBranchStats = async (req, res) => {
    try {
        const { branch } = req.params;
        const products = readData('products');
        const orders = readData('orders');
        const repairs = readData('repairs');
        
        const branchProducts = products.filter(p => p.branch === branch || p.branch === 'all');
        const branchOrders = orders.filter(o => o.branch === branch);
        const branchRepairs = repairs.filter(r => r.branch === branch);
        
        const stats = {
            branch,
            totalProducts: branchProducts.length,
            totalOrders: branchOrders.length,
            totalRepairs: branchRepairs.length,
            lowStock: branchProducts.filter(p => p.stock <= 5).length,
            revenue: branchOrders.reduce((sum, o) => sum + (o.total || 0), 0),
            pendingOrders: branchOrders.filter(o => o.status === 'pending').length
        };

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