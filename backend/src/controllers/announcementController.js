const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Create announcement (Admin only)
exports.createAnnouncement = async (req, res) => {
    try {
        const { 
            title, content, type, 
            priority, targetAudience,
            expiresAt
        } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        const announcement = {
            id: uuidv4(),
            title,
            content,
            type: type || 'general', // general, important, urgent
            priority: priority || 'normal', // low, normal, high, urgent
            targetAudience: targetAudience || 'all', // all, users, admins
            expiresAt: expiresAt || null,
            isActive: true,
            views: 0,
            createdBy: req.user.id,
            createdByName: req.user.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('announcements', announcement);

        // Send notification to users via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('new-announcement', announcement);
            console.log(`📢 Announcement broadcast: ${title}`);
        }

        res.status(201).json({
            success: true,
            announcement,
            message: 'Announcement created successfully'
        });
    } catch (error) {
        console.error('❌ Announcement error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all announcements
exports.getAnnouncements = async (req, res) => {
    try {
        let announcements = readData('announcements');
        
        // Filter active announcements
        announcements = announcements.filter(a => {
            if (!a.isActive) return false;
            if (a.expiresAt && new Date(a.expiresAt) < new Date()) {
                return false;
            }
            return true;
        });

        // Sort by priority and date
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        announcements.sort((a, b) => {
            const priorityDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json({
            success: true,
            announcements,
            total: announcements.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get announcement by ID
exports.getAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = findById('announcements', id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        // Increment views
        announcement.views = (announcement.views || 0) + 1;
        updateItem('announcements', id, announcement);

        res.json({
            success: true,
            announcement
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update announcement (Admin only)
exports.updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const announcement = findById('announcements', id);
        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        const updatedAnnouncement = {
            ...announcement,
            ...updates,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
        };

        updateItem('announcements', id, updatedAnnouncement);

        res.json({
            success: true,
            announcement: updatedAnnouncement,
            message: 'Announcement updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete announcement (Admin only)
exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        deleteItem('announcements', id);
        res.json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user announcements
exports.getUserAnnouncements = async (req, res) => {
    try {
        const announcements = readData('announcements');
        
        // Filter announcements for users
        const userAnnouncements = announcements.filter(a => {
            if (!a.isActive) return false;
            if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
            if (a.targetAudience === 'admins' && !req.user.isAdmin) return false;
            return true;
        });

        res.json({
            success: true,
            announcements: userAnnouncements.slice(0, 20) // Limit to 20
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};