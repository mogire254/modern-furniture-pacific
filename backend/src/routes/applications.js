const express = require('express');
const router = express.Router();
const { readData, findById, addItem, updateItem, deleteItem } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');
const { protect, isSuperAdmin, isCEOAdmin } = require('../middleware/auth');

// ===== GET ALL APPLICATIONS =====
router.get('/', async (req, res) => {
    try {
        const applications = readData('applications');
        res.json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== GET SINGLE APPLICATION =====
router.get('/:id', async (req, res) => {
    try {
        const application = findById('applications', req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        res.json({ success: true, application });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== CREATE APPLICATION (Admin only) =====
router.post('/', protect, isCEOAdmin, async (req, res) => {
    try {
        const newApplication = {
            id: uuidv4(),
            ...req.body,
            isOpen: true,
            createdAt: new Date().toISOString(),
            createdBy: req.user.id
        };
        addItem('applications', newApplication);
        res.status(201).json({
            success: true,
            application: newApplication
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== APPLY FOR JOB =====
router.post('/:id/apply', protect, async (req, res) => {
    try {
        const application = findById('applications', req.params.id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Check if application is closed
        if (!application.isOpen) {
            return res.status(400).json({
                success: false,
                message: 'This application is closed. Please wait for the next application period.'
            });
        }

        // Check if application deadline has passed
        if (application.closeDate && new Date() > new Date(application.closeDate)) {
            return res.status(400).json({
                success: false,
                message: 'This application deadline has passed. Please wait for the next application period.'
            });
        }

        // Check if user already applied
        const existing = application.applications?.find(a => a.userId === req.user.id);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this position'
            });
        }

        const newApplication = {
            userId: req.user.id,
            ...req.body,
            status: 'pending',
            appliedAt: new Date().toISOString()
        };

        if (!application.applications) application.applications = [];
        application.applications.push(newApplication);
        updateItem('applications', application.id, application);

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application: newApplication
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== UPDATE APPLICATION (Admin only) =====
router.put('/:id', protect, isCEOAdmin, async (req, res) => {
    try {
        const application = findById('applications', req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        const updated = updateItem('applications', req.params.id, req.body);
        res.json({ success: true, application: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== DELETE APPLICATION (Admin only) =====
router.delete('/:id', protect, isSuperAdmin, async (req, res) => {
    try {
        const application = findById('applications', req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        deleteItem('applications', req.params.id);
        res.json({ success: true, message: 'Application deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
