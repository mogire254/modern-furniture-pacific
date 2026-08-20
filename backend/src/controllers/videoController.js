const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Upload video (Admin only)
exports.uploadVideo = async (req, res) => {
    try {
        const { 
            title, description, category, 
            tags = [], isFeatured = false,
            videoUrl, thumbnailUrl
        } = req.body;

        if (!title || !videoUrl) {
            return res.status(400).json({
                success: false,
                message: 'Title and video URL are required'
            });
        }

        const video = {
            id: uuidv4(),
            title,
            description: description || '',
            category: category || 'general',
            tags: tags,
            isFeatured,
            videoUrl,
            thumbnailUrl: thumbnailUrl || '',
            likes: 0,
            views: 0,
            status: 'active',
            createdBy: req.user.id,
            createdByName: req.user.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('videos', video);

        res.status(201).json({
            success: true,
            video,
            message: 'Video uploaded successfully'
        });
    } catch (error) {
        console.error('❌ Video upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// AI Generate video/image (Super Admin only)
exports.aiGenerate = async (req, res) => {
    try {
        const { 
            prompt, type, imageUrl, 
            style, duration, resolution
        } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required'
            });
        }

        // This would integrate with Stability AI or other AI service
        console.log(`🎨 AI Generation requested:`);
        console.log(`📝 Prompt: ${prompt}`);
        console.log(`📷 Type: ${type || 'image'}`);
        console.log(`🖼️ Source Image: ${imageUrl || 'none'}`);

        // Mock AI response - in production, call actual AI API
        const generatedContent = {
            id: uuidv4(),
            prompt,
            type: type || 'image',
            style: style || 'modern',
            duration: duration || 15,
            resolution: resolution || '1080p',
            url: `/uploads/ai-generated/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${type === 'video' ? 'mp4' : 'png'}`,
            createdAt: new Date().toISOString(),
            createdBy: req.user.id
        };

        // Save to AI generation history
        const aiHistory = readData('ai-history');
        aiHistory.push(generatedContent);
        writeData('ai-history', aiHistory);

        res.json({
            success: true,
            content: generatedContent,
            message: 'AI content generated successfully',
            downloadUrl: generatedContent.url
        });
    } catch (error) {
        console.error('❌ AI Generation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all videos
exports.getVideos = async (req, res) => {
    try {
        const { category, featured } = req.query;
        let videos = readData('videos');

        if (category) {
            videos = videos.filter(v => v.category === category);
        }

        if (featured === 'true') {
            videos = videos.filter(v => v.isFeatured);
        }

        res.json({
            success: true,
            videos,
            total: videos.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single video
exports.getVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const video = findById('videos', id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        // Increment views
        video.views = (video.views || 0) + 1;
        updateItem('videos', id, video);

        res.json({
            success: true,
            video
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update video (Admin only)
exports.updateVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const video = findById('videos', id);
        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        const updatedVideo = {
            ...video,
            ...updates,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
        };

        updateItem('videos', id, updatedVideo);

        res.json({
            success: true,
            video: updatedVideo,
            message: 'Video updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete video (Admin only)
exports.deleteVideo = async (req, res) => {
    try {
        const { id } = req.params;
        deleteItem('videos', id);
        res.json({
            success: true,
            message: 'Video deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Like video
exports.likeVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const video = findById('videos', id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        video.likes = (video.likes || 0) + 1;
        updateItem('videos', id, video);

        res.json({
            success: true,
            likes: video.likes,
            message: 'Video liked'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get AI generation history (Super Admin only)
exports.getAIHistory = async (req, res) => {
    try {
        const aiHistory = readData('ai-history');
        res.json({
            success: true,
            history: aiHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};