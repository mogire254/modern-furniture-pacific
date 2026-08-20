const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Create order
exports.createOrder = async (req, res) => {
    try {
        const { productId, quantity = 1, deliveryAddress } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const products = readData('products');
        const product = products.find(p => p.id === productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const order = {
            id: uuidv4(),
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            productId: productId,
            productName: product.name,
            quantity: quantity,
            price: product.price || 0,
            total: (product.price || 0) * quantity,
            status: 'pending',
            paymentStatus: 'pending',
            deliveryAddress: deliveryAddress || '',
            branch: product.branch || 'all',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('orders', order);
        res.status(201).json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get user's orders
exports.getMyOrders = async (req, res) => {
    try {
        const orders = readData('orders');
        const userOrders = orders.filter(o => o.userId === req.user.id);
        res.json({ success: true, orders: userOrders || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = readData('orders');
        res.json({ success: true, orders: orders || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const order = findById('orders', id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = status;
        order.updatedAt = new Date().toISOString();

        updateItem('orders', id, order);
        res.json({ success: true, order, message: `Order status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update payment status (Admin only)
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;
        const order = findById('orders', id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.paymentStatus = paymentStatus;
        order.updatedAt = new Date().toISOString();

        updateItem('orders', id, order);
        res.json({ success: true, order, message: `Payment status updated to ${paymentStatus}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cancel order (User)
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = findById('orders', id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.userId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (order.status === 'delivered') {
            return res.status(400).json({ success: false, message: 'Cannot cancel delivered order' });
        }

        order.status = 'cancelled';
        order.updatedAt = new Date().toISOString();

        updateItem('orders', id, order);
        res.json({ success: true, order, message: 'Order cancelled' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};