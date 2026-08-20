const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Get all jobs (Public)
router.get('/', async (req, res) => {
    try {
        const jobs = readData('jobs');
        res.json({
            success: true,
            jobs: jobs || []
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create job (Admin only)
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        const { title, location, type, deadline, description, isOpen } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Title and description are required' });
        }

        const job = {
            id: uuidv4(),
            title,
            location: location || 'Nairobi',
            type: type || 'full-time',
            deadline: deadline || null,
            description,
            isOpen: isOpen !== undefined ? isOpen : true,
            applicants: [],
            createdAt: new Date().toISOString(),
            createdBy: req.user.id,
            createdByName: req.user.name
        };

        addItem('jobs', job);
        res.status(201).json({ success: true, job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update job (Admin only)
router.put('/:id', protect, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const job = findById('jobs', id);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        const updatedJob = { ...job, ...updates, updatedAt: new Date().toISOString() };
        updateItem('jobs', id, updatedJob);
        res.json({ success: true, job: updatedJob });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Patch job status (Admin only)
router.patch('/:id', protect, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isOpen } = req.body;
        const job = findById('jobs', id);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        job.isOpen = isOpen;
        job.updatedAt = new Date().toISOString();
        updateItem('jobs', id, job);
        res.json({ success: true, job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete job (Admin only)
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        deleteItem('jobs', id);
        res.json({ success: true, message: 'Job deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Apply for job (User)
router.post('/:id/apply', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const job = findById('jobs', id);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        if (!job.isOpen) {
            return res.status(400).json({ success: false, message: 'Applications are closed for this position' });
        }
        
        // Check if already applied
        if (job.applicants && job.applicants.some(a => a.userId === req.user.id)) {
            return res.status(400).json({ success: false, message: 'You have already applied for this position' });
        }
        
        const application = {
            id: uuidv4(),
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            userPhone: req.user.phone || '',
            status: 'pending',
            appliedAt: new Date().toISOString()
        };
        
        if (!job.applicants) job.applicants = [];
        job.applicants.push(application);
        updateItem('jobs', id, job);
        
        res.status(201).json({ success: true, application });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get applicants for a job (Admin only)
router.get('/:id/applicants', protect, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const job = findById('jobs', id);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        res.json({ success: true, applicants: job.applicants || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;