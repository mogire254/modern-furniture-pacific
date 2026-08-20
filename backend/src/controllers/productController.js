const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const { category, status, search } = req.query;
        let products = readData('products');

        // Filter by category
        if (category) {
            products = products.filter(p => p.category === category);
        }

        // Filter by status
        if (status) {
            products = products.filter(p => p.status === status);
        }

        // Search
        if (search) {
            const searchLower = search.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(searchLower) ||
                p.description.toLowerCase().includes(searchLower)
            );
        }

        res.json({
            success: true,
            products,
            total: products.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single product
exports.getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = findById('products', id);

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
};

// Create product (Admin only)
exports.createProduct = async (req, res) => {
    try {
        const { 
            name, description, price, category, images, 
            stock, dimensions, materials, colors, branch,
            isFeatured = false, has360View = false,
            videoUrl = '', weight = 0, brand = ''
        } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, and category are required'
            });
        }

        const newProduct = {
            id: uuidv4(),
            name,
            description: description || '',
            price: parseFloat(price),
            category,
            images: images || [],
            stock: parseInt(stock) || 0,
            status: parseInt(stock) > 0 ? 'available' : 'out-of-stock',
            dimensions: dimensions || { width: 0, height: 0, depth: 0 },
            materials: materials || [],
            colors: colors || [],
            branch: branch || 'all',
            isFeatured,
            has360View,
            videoUrl,
            weight,
            brand,
            ratings: {
                average: 0,
                count: 0
            },
            views: 0,
            soldCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: req.user.id
        };

        addItem('products', newProduct);

        res.status(201).json({
            success: true,
            product: newProduct,
            message: 'Product created successfully'
        });
    } catch (error) {
        console.error('❌ Create product error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update product (Admin only)
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const products = readData('products');
        const productIndex = products.findIndex(p => p.id === id);

        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Update product
        const updatedProduct = {
            ...products[productIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
        };

        // Update status based on stock
        if (updates.stock !== undefined) {
            updatedProduct.status = parseInt(updates.stock) > 0 ? 'available' : 'out-of-stock';
        }

        products[productIndex] = updatedProduct;
        writeData('products', products);

        res.json({
            success: true,
            product: updatedProduct,
            message: 'Product updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete product (Admin only)
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        deleteItem('products', id);
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update product status (Admin only)
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const product = findById('products', id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        product.status = status;
        product.updatedAt = new Date().toISOString();
        product.updatedBy = req.user.id;

        // If marked as sold, update sold count
        if (status === 'sold') {
            product.soldCount = (product.soldCount || 0) + 1;
        }

        updateItem('products', id, product);

        // Notify users who requested notification
        if (status === 'available') {
            // Send notifications to users who requested
            const notifications = readData('notifications');
            const productNotifications = notifications.filter(n => n.productId === id && n.type === 'stock_alert');
            
            productNotifications.forEach(notification => {
                // Send email/SMS notification
                console.log(`📱 Notifying ${notification.userEmail} that ${product.name} is back in stock`);
            });
        }

        res.json({
            success: true,
            product,
            message: `Product status updated to ${status}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get featured products
exports.getFeatured = async (req, res) => {
    try {
        const products = readData('products');
        const featured = products.filter(p => p.isFeatured && p.status === 'available');
        res.json({
            success: true,
            products: featured
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get products by category
exports.getByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const products = readData('products');
        const categoryProducts = products.filter(p => p.category === category);
        res.json({
            success: true,
            products: categoryProducts,
            total: categoryProducts.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Request stock notification
exports.requestNotification = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = findById('products', productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const notification = {
            id: uuidv4(),
            productId,
            userId: req.user.id,
            userEmail: req.user.email,
            userName: req.user.name,
            type: 'stock_alert',
            createdAt: new Date().toISOString()
        };

        addItem('notifications', notification);

        res.json({
            success: true,
            message: 'You will be notified when this product is back in stock'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};