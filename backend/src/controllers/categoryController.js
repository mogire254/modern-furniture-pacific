const { readData, writeData, addItem, updateItem, deleteItem } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const categories = readData('categories');
        res.json({
            success: true,
            categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create category (Admin only)
exports.createCategory = async (req, res) => {
    try {
        const { name, description, icon, image } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        const categories = readData('categories');
        if (categories.find(c => c.name === name)) {
            return res.status(400).json({
                success: false,
                message: 'Category already exists'
            });
        }

        const newCategory = {
            id: uuidv4(),
            name,
            description: description || '',
            icon: icon || '',
            image: image || '',
            productCount: 0,
            createdAt: new Date().toISOString(),
            createdBy: req.user.id
        };

        addItem('categories', newCategory);

        res.status(201).json({
            success: true,
            category: newCategory,
            message: 'Category created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update category (Admin only)
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const category = updateItem('categories', id, updates);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            category,
            message: 'Category updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete category (Admin only)
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        deleteItem('categories', id);
        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};