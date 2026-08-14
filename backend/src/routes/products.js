const express = require('express');
const router = express.Router();
const { readData, findById, addItem, updateItem, deleteItem } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');

// ===== GET ALL PRODUCTS =====
router.get('/', (req, res) => {
  try {
    const products = readData('products');
    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== GET PRODUCT BY ID =====
router.get('/:id', (req, res) => {
  try {
    const product = findById('products', req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    res.json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== CREATE PRODUCT =====
router.post('/', protect, (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      salePrice, 
      category, 
      stock, 
      images, 
      status, 
      branch,
      features,
      dimensions
    } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and category are required'
      });
    }

    const newProduct = {
      id: uuidv4(),
      name: name,
      description: description || '',
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      category: category,
      stock: stock || 0,
      images: images || [],
      status: status || 'available',
      branch: branch || 'all',
      features: features || [],
      dimensions: dimensions || {},
      rating: 0,
      numReviews: 0,
      isFeatured: false,
      isNew: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addItem('products', newProduct);

    res.status(201).json({
      success: true,
      product: newProduct
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== UPDATE PRODUCT =====
router.put('/:id', protect, (req, res) => {
  try {
    const product = findById('products', req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const { 
      name, 
      description, 
      price, 
      salePrice, 
      category, 
      stock, 
      images, 
      status, 
      branch,
      features,
      dimensions
    } = req.body;

    const updatedProduct = {
      ...product,
      name: name || product.name,
      description: description || product.description,
      price: price ? parseFloat(price) : product.price,
      salePrice: salePrice !== undefined ? (salePrice ? parseFloat(salePrice) : null) : product.salePrice,
      category: category || product.category,
      stock: stock !== undefined ? stock : product.stock,
      images: images || product.images,
      status: status || product.status,
      branch: branch || product.branch,
      features: features || product.features,
      dimensions: dimensions || product.dimensions,
      updatedAt: new Date().toISOString()
    };

    updateItem('products', req.params.id, updatedProduct);

    res.json({
      success: true,
      product: updatedProduct
    });
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== DELETE PRODUCT =====
router.delete('/:id', protect, (req, res) => {
  try {
    const product = findById('products', req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    deleteItem('products', req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ===== UPDATE PRODUCT STATUS =====
router.patch('/:id/status', protect, (req, res) => {
  try {
    const { status } = req.body;
    const product = findById('products', req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const validStatuses = ['available', 'sold', 'pre-order'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: available, sold, or pre-order'
      });
    }

    product.status = status;
    product.updatedAt = new Date().toISOString();
    updateItem('products', req.params.id, product);

    res.json({
      success: true,
      product: product
    });
  } catch (error) {
    console.error('❌ Error updating product status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
