const express = require('express');
const router = express.Router();
const { readData, findById, addItem, updateItem, deleteItem } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');

// ===== GET ALL CATEGORIES =====
router.get('/', (req, res) => {
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
});

// ===== GET CATEGORY BY ID =====
router.get('/:id', (req, res) => {
  try {
    const category = findById('categories', req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.json({
      success: true,
      category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== CREATE CATEGORY =====
router.post('/', protect, (req, res) => {
  try {
    const { name, description, image, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const newCategory = {
      id: uuidv4(),
      name: name,
      description: description || '',
      image: image || null,
      icon: icon || null,
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addItem('categories', newCategory);

    res.status(201).json({
      success: true,
      category: newCategory
    });
  } catch (error) {
    console.error('❌ Error creating category:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== UPDATE CATEGORY =====
router.put('/:id', protect, (req, res) => {
  try {
    const category = findById('categories', req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, description, image, icon } = req.body;
    
    const updatedCategory = {
      ...category,
      name: name || category.name,
      description: description || category.description,
      image: image || category.image,
      icon: icon || category.icon,
      updatedAt: new Date().toISOString()
    };

    updateItem('categories', req.params.id, updatedCategory);

    res.json({
      success: true,
      category: updatedCategory
    });
  } catch (error) {
    console.error('❌ Error updating category:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== DELETE CATEGORY =====
router.delete('/:id', protect, (req, res) => {
  try {
    const category = findById('categories', req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    deleteItem('categories', req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
