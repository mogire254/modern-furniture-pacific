const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Get user's cart
exports.getCart = async (req, res) => {
    try {
        const carts = readData('carts');
        const cart = carts.find(c => c.userId === req.user.id);
        res.json({
            success: true,
            cart: cart || { items: [], total: 0 }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const products = readData('products');
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        let carts = readData('carts');
        let cart = carts.find(c => c.userId === req.user.id);

        if (!cart) {
            cart = {
                id: uuidv4(),
                userId: req.user.id,
                items: [],
                total: 0,
                createdAt: new Date().toISOString()
            };
        }

        const existingItem = cart.items.find(i => i.productId === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                productId,
                quantity: quantity,
                price: product.price || 0,
                name: product.name,
                image: product.images && product.images.length > 0 ? product.images[0] : null
            });
        }

        cart.total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        cart.updatedAt = new Date().toISOString();

        if (carts.find(c => c.userId === req.user.id)) {
            updateItem('carts', cart.id, cart);
        } else {
            addItem('carts', cart);
        }

        res.json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const carts = readData('carts');
        const cart = carts.find(c => c.userId === req.user.id);

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = cart.items.filter(i => i.productId !== productId);
        cart.total = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        cart.updatedAt = new Date().toISOString();

        updateItem('carts', cart.id, cart);
        res.json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const carts = readData('carts');
        const cart = carts.find(c => c.userId === req.user.id);

        if (cart) {
            cart.items = [];
            cart.total = 0;
            cart.updatedAt = new Date().toISOString();
            updateItem('carts', cart.id, cart);
        }

        res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};