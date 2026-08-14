const express = require('express');
const router = express.Router();
const { readData, findById, addItem, updateItem } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');

// @route   GET /api/cart
router.get('/', protect, (req, res) => {
  try {
    const carts = readData('carts');
    const userCart = carts.find(c => c.userId === req.user.id);
    res.json({
      success: true,
      cart: userCart || { items: [], total: 0 }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/cart
router.post('/', protect, (req, res) => {
  try {
    const carts = readData('carts');
    let cart = carts.find(c => c.userId === req.user.id);
    
    if (!cart) {
      cart = {
        id: uuidv4(),
        userId: req.user.id,
        items: [],
        total: 0
      };
      addItem('carts', cart);
    }

    const { productId, quantity } = req.body;
    const product = findById('products', productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const existingItem = cart.items.find(i => i.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      cart.items.push({
        productId,
        quantity: quantity || 1,
        price: product.price
      });
    }

    cart.total = cart.items.reduce((sum, item) => {
      const prod = findById('products', item.productId);
      return sum + (prod ? prod.price * item.quantity : 0);
    }, 0);

    updateItem('carts', cart.id, cart);

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
