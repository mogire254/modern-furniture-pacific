const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ===== FIXED: Ensure all required files exist - ADDED mattresses.json =====
const requiredFiles = [
    'users.json', 'admins.json', 'products.json', 'categories.json',
    'applications.json', 'scanner-measurements.json', 'suppliers.json',
    'repairs.json', 'reviews.json', 'videos.json', 'orders.json',
    'chat.json', 'admin-chat.json', 'deliveries.json', 'announcements.json',
    'settings.json', 'branches.json',
    'mattresses.json',          // ← ADDED
    'ai-history.json',          // ← ADDED
    'notifications.json'        // ← ADDED
];

requiredFiles.forEach(file => {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));
        console.log(`📄 Created ${file}`);
    }
});

// Read data from JSON file
const readData = (fileName) => {
    try {
        const filePath = path.join(DATA_DIR, `${fileName}.json`);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${fileName}.json:`, error);
        return [];
    }
};

// Write data to JSON file
const writeData = (fileName, data) => {
    try {
        const filePath = path.join(DATA_DIR, `${fileName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${fileName}.json:`, error);
        return false;
    }
};

// Find user by email (searches both users and admins)
const findUserByEmail = (email) => {
    const users = readData('users');
    const admins = readData('admins');
    const allUsers = [...users, ...admins];
    return allUsers.find(user => user.email === email);
};

// Find user by ID (searches both users and admins)
const findUserById = (id) => {
    const users = readData('users');
    const admins = readData('admins');
    const allUsers = [...users, ...admins];
    return allUsers.find(user => user.id === id);
};

// Get all users (including admins)
const getAllUsers = () => {
    const users = readData('users');
    const admins = readData('admins');
    return [...users, ...admins];
};

// Add item to file
const addItem = (fileName, item) => {
    const data = readData(fileName);
    data.push(item);
    writeData(fileName, data);
    return item;
};

// Add multiple items
const addItems = (fileName, items) => {
    const data = readData(fileName);
    items.forEach(item => data.push(item));
    writeData(fileName, data);
    return items;
};

// Update item in file
const updateItem = (fileName, id, updatedData) => {
    const data = readData(fileName);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return null;
    data[index] = { ...data[index], ...updatedData, updatedAt: new Date().toISOString() };
    writeData(fileName, data);
    return data[index];
};

// Delete item from file
const deleteItem = (fileName, id) => {
    const data = readData(fileName);
    const filtered = data.filter(item => item.id !== id);
    writeData(fileName, filtered);
    return true;
};

// Find item by ID in specific file
const findById = (fileName, id) => {
    const data = readData(fileName);
    return data.find(item => item.id === id);
};

// Find items by field
const findByField = (fileName, field, value) => {
    const data = readData(fileName);
    return data.filter(item => item[field] === value);
};

// Get stats
const getStats = () => {
    const users = readData('users');
    const admins = readData('admins');
    const products = readData('products');
    const orders = readData('orders');
    const applications = readData('applications');
    const repairs = readData('repairs');
    const suppliers = readData('suppliers');
    const reviews = readData('reviews');
    const mattresses = readData('mattresses'); // ← ADDED
    
    const totalUsers = users.length + admins.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    return {
        totalUsers,
        totalAdmins: admins.length,
        totalProducts: products.length,
        totalMattresses: mattresses.length, // ← ADDED
        totalOrders: orders.length,
        totalApplications: applications.length,
        totalRepairs: repairs.length,
        totalSuppliers: suppliers.length,
        totalReviews: reviews.length,
        totalRevenue,
        activeUsers: users.filter(u => u.isActive !== false).length,
        activeAdmins: admins.filter(a => a.isActive !== false).length,
        pendingApplications: applications.filter(a => a.status === 'pending').length,
        pendingRepairs: repairs.filter(r => r.status === 'pending').length
    };
};

// Backup data
const backupData = () => {
    try {
        const backupDir = path.join(DATA_DIR, 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `backup-${timestamp}`);
        fs.mkdirSync(backupPath, { recursive: true });
        
        const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
        files.forEach(file => {
            const srcPath = path.join(DATA_DIR, file);
            const destPath = path.join(backupPath, file);
            fs.copyFileSync(srcPath, destPath);
        });
        
        console.log(`💾 Backup created at ${backupPath}`);
        return true;
    } catch (error) {
        console.error('❌ Backup failed:', error);
        return false;
    }
};

module.exports = {
    readData,
    writeData,
    findUserByEmail,
    findUserById,
    getAllUsers,
    addItem,
    addItems,
    updateItem,
    deleteItem,
    findById,
    findByField,
    getStats,
    backupData,
    DATA_DIR
};