const express = require('express');
const router = express.Router();
const { readData, writeData, addItem, findById, updateItem } = require('../utils/fileHandler');
const { protect } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// ===== GET ALL SCANNER MEASUREMENTS (Admin only) =====
router.get('/', protect, (req, res) => {
    try {
        const measurements = readData('scanner-measurements');
        res.json({
            success: true,
            measurements: measurements || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== GET MEASUREMENTS BY BRANCH =====
router.get('/branch/:branch', protect, (req, res) => {
    try {
        const measurements = readData('scanner-measurements');
        const branchMeasurements = measurements.filter(m => m.branch === req.params.branch);
        res.json({
            success: true,
            measurements: branchMeasurements
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== SAVE SCANNER MEASUREMENT (User) =====
router.post('/', (req, res) => {
    try {
        const { width, length, height, userId, userName, userEmail, userPhone, branch } = req.body;
        
        const measurement = {
            id: uuidv4(),
            userId: userId || 'guest',
            userName: userName || 'Guest User',
            userEmail: userEmail || '',
            userPhone: userPhone || '',
            width: width || 0,
            length: length || 0,
            height: height || 0,
            area: (width || 0) * (length || 0),
            branch: branch || 'all',
            status: 'pending', // pending, matched, contacted, custom_order
            matchedProducts: [],
            adminNote: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        addItem('scanner-measurements', measurement);
        
        res.status(201).json({
            success: true,
            measurement: measurement
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== UPDATE MEASUREMENT STATUS (Admin) =====
router.put('/:id', protect, (req, res) => {
    try {
        const { status, adminNote, matchedProducts } = req.body;
        const measurement = findById('scanner-measurements', req.params.id);
        
        if (!measurement) {
            return res.status(404).json({
                success: false,
                message: 'Measurement not found'
            });
        }
        
        const updated = {
            ...measurement,
            status: status || measurement.status,
            adminNote: adminNote || measurement.adminNote,
            matchedProducts: matchedProducts || measurement.matchedProducts,
            updatedAt: new Date().toISOString()
        };
        
        updateItem('scanner-measurements', req.params.id, updated);
        
        res.json({
            success: true,
            measurement: updated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ===== DELETE MEASUREMENT (Admin) =====
router.delete('/:id', protect, (req, res) => {
    try {
        const measurements = readData('scanner-measurements');
        const filtered = measurements.filter(m => m.id !== req.params.id);
        writeData('scanner-measurements', filtered);
        
        res.json({
            success: true,
            message: 'Measurement deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
