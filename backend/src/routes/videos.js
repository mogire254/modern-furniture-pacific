const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Get all published videos (Public)
router.get('/', async (req, res) => {
    try {
        const videos = readData('videos');
        // Only return published/sent videos
        const published = videos.filter(v => v.published === true || v.sentToUsers === true || v.sentToClients === true);
        res.json({
            success: true,
            videos: published || []
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload video (Admin only)
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        const { title, description, note, fileData, fileName, fileType, branch, category } = req.body;
        
        if (!title || !fileData) {
            return res.status(400).json({ success: false, message: 'Title and file are required' });
        }

        const video = {
            id: uuidv4(),
            title,
            description: description || '',
            note: note || description || '',
            fileData,
            fileName: fileName || 'video.mp4',
            fileType: fileType || 'video',
            branch: branch || 'all',
            category: category || 'general',
            views: 0,
            likes: 0,
            published: true,
            sentToUsers: true,
            sentToClients: true,
            uploadedBy: req.user.id,
            uploadedByName: req.user.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('videos', video);
        res.status(201).json({ success: true, video });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete video (Admin only)
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        deleteItem('videos', id);
        res.json({ success: true, message: 'Video deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update video (Admin only)
router.put('/:id', protect, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const video = findById('videos', id);
        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }
        const updatedVideo = { ...video, ...updates, updatedAt: new Date().toISOString() };
        updateItem('videos', id, updatedVideo);
        res.json({ success: true, video: updatedVideo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Like video
router.post('/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const video = findById('videos', id);
        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }
        video.likes = (video.likes || 0) + 1;
        updateItem('videos', id, video);
        res.json({ success: true, likes: video.likes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Increment view count
router.post('/:id/view', async (req, res) => {
    try {
        const { id } = req.params;
        const video = findById('videos', id);
        if (!video) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }
        video.views = (video.views || 0) + 1;
        updateItem('videos', id, video);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;