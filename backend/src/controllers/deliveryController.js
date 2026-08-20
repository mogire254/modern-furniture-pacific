const { readData, writeData, addItem, updateItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Create delivery request
exports.createDelivery = async (req, res) => {
    try {
        const { 
            orderId, address, location, 
            contactName, contactPhone,
            specialInstructions
        } = req.body;

        if (!orderId || !address || !location) {
            return res.status(400).json({
                success: false,
                message: 'Order ID, address, and location are required'
            });
        }

        // Check if order exists
        const order = findById('orders', orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Calculate distance and cost
        const distance = calculateDistance(location);
        const transportCost = calculateTransportCost(distance);

        const delivery = {
            id: uuidv4(),
            orderId,
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            userPhone: req.user.phone || 'Not provided',
            address,
            location: {
                lat: location.lat || 0,
                lng: location.lng || 0
            },
            contactName: contactName || req.user.name,
            contactPhone: contactPhone || req.user.phone || '',
            specialInstructions: specialInstructions || '',
            distance: distance,
            transportCost: transportCost,
            status: 'pending', // pending, processing, dispatched, arrived, delivered
            assignedTo: null,
            assignedByName: null,
            trackingNumber: `DEL-${Date.now().toString().slice(-6)}`,
            estimatedDelivery: null,
            actualDelivery: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('deliveries', delivery);

        // Update order with delivery info
        order.deliveryId = delivery.id;
        order.deliveryStatus = 'pending';
        order.transportCost = transportCost;
        order.total = (order.total || 0) + transportCost;
        updateItem('orders', orderId, order);

        res.status(201).json({
            success: true,
            delivery,
            message: 'Delivery created successfully'
        });
    } catch (error) {
        console.error('❌ Delivery error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Calculate distance (simplified - in production use Google Maps API)
function calculateDistance(location) {
    return (Math.random() * 20 + 1).toFixed(1); // 1-20 km
}

// Calculate transport cost
function calculateTransportCost(distance) {
    const baseRate = 100; // KES per km
    const cost = parseFloat(distance) * baseRate;
    return Math.round(cost / 50) * 50; // Round to nearest 50
}

// Get all deliveries (Admin only)
exports.getDeliveries = async (req, res) => {
    try {
        const { status } = req.query;
        let deliveries = readData('deliveries');

        if (status) {
            deliveries = deliveries.filter(d => d.status === status);
        }

        res.json({
            success: true,
            deliveries,
            total: deliveries.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user's deliveries
exports.getMyDeliveries = async (req, res) => {
    try {
        const deliveries = readData('deliveries');
        const userDeliveries = deliveries.filter(d => d.userId === req.user.id);
        res.json({
            success: true,
            deliveries: userDeliveries
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get delivery by ID
exports.getDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const delivery = findById('deliveries', id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        res.json({
            success: true,
            delivery
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update delivery status (Admin only)
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignedTo, notes } = req.body;

        const delivery = findById('deliveries', id);
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        const updates = {
            status: status || delivery.status,
            notes: notes || delivery.notes,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
        };

        if (assignedTo) {
            // Find the admin being assigned
            const admins = readData('admins');
            const admin = admins.find(a => a.id === assignedTo);
            if (admin) {
                updates.assignedTo = assignedTo;
                updates.assignedByName = admin.name;
            }
        }

        if (status === 'arrived') {
            updates.actualDelivery = new Date().toISOString();
        }

        if (status === 'delivered') {
            updates.actualDelivery = new Date().toISOString();
            // Update order
            const order = findById('orders', delivery.orderId);
            if (order) {
                order.status = 'completed';
                order.deliveryStatus = 'delivered';
                order.completedAt = new Date().toISOString();
                updateItem('orders', order.id, order);

                // Mark product as sold
                const product = findById('products', order.productId);
                if (product) {
                    product.status = 'sold';
                    product.soldCount = (product.soldCount || 0) + 1;
                    updateItem('products', product.id, product);
                    console.log(`🔴 Product ${product.name} marked as sold`);
                }
            }
        }

        updateItem('deliveries', id, updates);

        // Get updated delivery
        const updatedDelivery = findById('deliveries', id);

        // Send notification based on status
        const statusMessages = {
            'dispatched': `📦 Your order has been dispatched! Tracking #${delivery.trackingNumber}`,
            'arrived': `📍 Your order has arrived at ${delivery.address}`,
            'delivered': `✅ Your order has been delivered! Please confirm receipt.`
        };

        if (statusMessages[status]) {
            console.log(`📱 ${statusMessages[status]}`);
            console.log(`📧 Notifying ${delivery.userEmail}`);
        }

        res.json({
            success: true,
            delivery: updatedDelivery,
            message: `Delivery ${status}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Confirm delivery (user)
exports.confirmDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const delivery = findById('deliveries', id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        if (delivery.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (delivery.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Delivery not marked as delivered yet'
            });
        }

        delivery.confirmed = true;
        delivery.confirmedAt = new Date().toISOString();
        delivery.updatedAt = new Date().toISOString();
        updateItem('deliveries', id, delivery);

        res.json({
            success: true,
            message: 'Delivery confirmed. Thank you for your purchase!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get delivery tracking
exports.trackDelivery = async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        const deliveries = readData('deliveries');
        const delivery = deliveries.find(d => d.trackingNumber === trackingNumber);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        res.json({
            success: true,
            delivery: {
                status: delivery.status,
                trackingNumber: delivery.trackingNumber,
                estimatedDelivery: delivery.estimatedDelivery,
                address: delivery.address,
                assignedTo: delivery.assignedByName || 'Unassigned',
                lastUpdate: delivery.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Assign delivery to admin (Super Admin only)
exports.assignDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId } = req.body;

        const delivery = findById('deliveries', id);
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        const admins = readData('admins');
        const admin = admins.find(a => a.id === adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        delivery.assignedTo = adminId;
        delivery.assignedByName = admin.name;
        delivery.status = 'processing';
        delivery.updatedAt = new Date().toISOString();

        updateItem('deliveries', id, delivery);

        res.json({
            success: true,
            delivery,
            message: `Delivery assigned to ${admin.name}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};