const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// ============================================
// GET ALL MATTRESSES
// ============================================
exports.getMattresses = async (req, res) => {
    try {
        const { category } = req.query;
        let mattresses = readData('mattresses');
        
        if (!mattresses || !Array.isArray(mattresses)) {
            mattresses = [];
        }

        if (category && category !== 'all') {
            mattresses = mattresses.filter(m => m.category === category);
        }

        mattresses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            mattresses,
            total: mattresses.length
        });
    } catch (error) {
        console.error('❌ Get mattresses error:', error);
        res.json({
            success: true,
            mattresses: [],
            total: 0
        });
    }
};

// ============================================
// GET SINGLE MATTRESS
// ============================================
exports.getMattress = async (req, res) => {
    try {
        const { id } = req.params;
        const mattress = findById('mattresses', id);

        if (!mattress) {
            return res.status(404).json({
                success: false,
                message: 'Mattress not found'
            });
        }

        res.json({
            success: true,
            mattress
        });
    } catch (error) {
        console.error('❌ Get mattress error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// CREATE MATTRESS
// ============================================
exports.createMattress = async (req, res) => {
    try {
        const { 
            name, description, price, salePrice, 
            category, stock, status, size, weight,
            features, images, branch = 'all'
        } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, and category are required'
            });
        }

        const validCategories = ['Orthopedic Mattress', 'Pocket Spring Mattress', 'Cloud Foam Mattress', 'Nobel Mattress'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
            });
        }

        const mattress = {
            id: uuidv4(),
            name,
            description: description || '',
            price: parseFloat(price),
            salePrice: salePrice ? parseFloat(salePrice) : null,
            category,
            stock: parseInt(stock) || 0,
            status: status || 'available',
            size: size || '',
            weight: weight || '',
            features: features ? features.split(',').map(f => f.trim()).filter(f => f) : [],
            images: images || [],
            branch: branch || 'all',
            isFeatured: false,
            ratings: { average: 0, count: 0 },
            createdBy: req.user.id,
            createdByName: req.user.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('mattresses', mattress);

        res.status(201).json({
            success: true,
            mattress,
            message: 'Mattress created successfully'
        });
    } catch (error) {
        console.error('❌ Create mattress error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE MATTRESS
// ============================================
exports.updateMattress = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const mattress = findById('mattresses', id);
        if (!mattress) {
            return res.status(404).json({
                success: false,
                message: 'Mattress not found'
            });
        }

        if (updates.category) {
            const validCategories = ['Orthopedic Mattress', 'Pocket Spring Mattress', 'Cloud Foam Mattress', 'Nobel Mattress'];
            if (!validCategories.includes(updates.category)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
                });
            }
        }

        const updatedMattress = {
            ...mattress,
            ...updates,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
        };

        updateItem('mattresses', id, updatedMattress);

        res.json({
            success: true,
            mattress: updatedMattress,
            message: 'Mattress updated successfully'
        });
    } catch (error) {
        console.error('❌ Update mattress error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// DELETE MATTRESS
// ============================================
exports.deleteMattress = async (req, res) => {
    try {
        const { id } = req.params;
        const mattress = findById('mattresses', id);

        if (!mattress) {
            return res.status(404).json({
                success: false,
                message: 'Mattress not found'
            });
        }

        deleteItem('mattresses', id);

        res.json({
            success: true,
            message: 'Mattress deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete mattress error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// TOGGLE MATTRESS STATUS
// ============================================
exports.toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const mattress = findById('mattresses', id);

        if (!mattress) {
            return res.status(404).json({
                success: false,
                message: 'Mattress not found'
            });
        }

        const statuses = ['available', 'sold', 'pre-order'];
        const currentIndex = statuses.indexOf(mattress.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        mattress.status = statuses[nextIndex];
        mattress.updatedAt = new Date().toISOString();

        updateItem('mattresses', id, mattress);

        res.json({
            success: true,
            mattress,
            message: `Mattress status changed to ${mattress.status}`
        });
    } catch (error) {
        console.error('❌ Toggle mattress status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET MATTRESS CATEGORIES
// ============================================
exports.getCategories = async (req, res) => {
    try {
        const categories = [
            { id: 'all', name: 'All', description: 'All mattresses' },
            { id: 'Orthopedic Mattress', name: 'Orthopedic Mattress', description: 'Supportive orthopedic mattresses' },
            { id: 'Pocket Spring Mattress', name: 'Pocket Spring Mattress', description: 'Premium pocket spring mattresses' },
            { id: 'Cloud Foam Mattress', name: 'Cloud Foam Mattress', description: 'Comfortable cloud foam mattresses' },
            { id: 'Nobel Mattress', name: 'Nobel Mattress', description: 'Luxury Nobel collection' }
        ];

        res.json({
            success: true,
            categories
        });
    } catch (error) {
        console.error('❌ Get categories error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};