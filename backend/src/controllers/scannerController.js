const { readData, writeData, addItem, updateItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Submit scanner measurement
exports.submitMeasurement = async (req, res) => {
    try {
        const { 
            length, width, height, 
            roomType, additionalNotes,
            images = []
        } = req.body;

        if (!length || !width) {
            return res.status(400).json({
                success: false,
                message: 'Length and width are required'
            });
        }

        // Get user details
        const user = {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            phone: req.user.phone || 'Not provided'
        };

        const measurement = {
            id: uuidv4(),
            userId: req.user.id,
            user,
            length: parseFloat(length),
            width: parseFloat(width),
            height: height ? parseFloat(height) : null,
            roomType: roomType || 'living_room',
            additionalNotes: additionalNotes || '',
            images: images,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('scanner-measurements', measurement);

        // Find matching products
        const products = readData('products');
        const matchingProducts = products.filter(p => {
            const pDim = p.dimensions || {};
            const tolerance = 0.5; // 0.5 meters tolerance
            const lengthMatch = Math.abs((pDim.length || 0) - measurement.length) <= tolerance;
            const widthMatch = Math.abs((pDim.width || 0) - measurement.width) <= tolerance;
            return lengthMatch && widthMatch && p.status === 'available';
        });

        // Notify admin
        console.log(`📏 New room scan from ${req.user.name}: ${measurement.length}x${measurement.width}`);
        console.log(`📦 Matching products found: ${matchingProducts.length}`);

        res.status(201).json({
            success: true,
            measurement,
            matchingProducts: matchingProducts.slice(0, 10), // Limit to 10
            hasMatches: matchingProducts.length > 0,
            message: matchingProducts.length > 0 
                ? 'Found matching products for your room size!' 
                : 'No exact matches found. Our team will contact you for custom build.'
        });
    } catch (error) {
        console.error('❌ Scanner error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all measurements (Admin only)
exports.getMeasurements = async (req, res) => {
    try {
        const { status } = req.query;
        let measurements = readData('scanner-measurements');

        if (status) {
            measurements = measurements.filter(m => m.status === status);
        }

        res.json({
            success: true,
            measurements,
            total: measurements.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user's measurements
exports.getMyMeasurements = async (req, res) => {
    try {
        const measurements = readData('scanner-measurements');
        const userMeasurements = measurements.filter(m => m.userId === req.user.id);
        res.json({
            success: true,
            measurements: userMeasurements
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update measurement status (Admin only)
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const measurement = findById('scanner-measurements', id);
        if (!measurement) {
            return res.status(404).json({
                success: false,
                message: 'Measurement not found'
            });
        }

        measurement.status = status;
        measurement.notes = notes || '';
        measurement.updatedAt = new Date().toISOString();
        measurement.reviewedBy = req.user.id;

        updateItem('scanner-measurements', id, measurement);

        // If status is 'contacted', send notification
        if (status === 'contacted') {
            console.log(`📞 Admin ${req.user.name} contacted user ${measurement.user.name}`);
        }

        res.json({
            success: true,
            measurement,
            message: `Measurement status updated to ${status}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get measurement by ID
exports.getMeasurement = async (req, res) => {
    try {
        const { id } = req.params;
        const measurement = findById('scanner-measurements', id);

        if (!measurement) {
            return res.status(404).json({
                success: false,
                message: 'Measurement not found'
            });
        }

        res.json({
            success: true,
            measurement
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};