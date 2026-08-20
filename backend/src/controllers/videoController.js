const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Upload video (Admin only)
exports.uploadVideo = async (req, res) => {
    try {
        const { 
            title, description, category, 
            tags = [], isFeatured = false,
            videoUrl, thumbnailUrl, fileData,
            sendTo = 'video' // 'video', 'carousel', 'both'
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
            fileData: fileData || '',
            sendTo: sendTo || 'video',
            likes: 0,
            views: 0,
            status: 'active',
            published: true,
            sentToUsers: true,
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
            prompt, type, imageData, 
            style, duration, resolution,
            sendTo = 'both'
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
        console.log(`🖼️ Source Image: ${imageData ? 'Yes' : 'None'}`);
        console.log(`📤 Send To: ${sendTo}`);

        // Generate AI content (in production, call actual AI API)
        const generatedContent = {
            id: uuidv4(),
            prompt,
            type: type || 'image',
            style: style || 'modern',
            duration: duration || 15,
            resolution: resolution || '1080p',
            imageData: imageData || null,
            sendTo: sendTo || 'both',
            url: `/uploads/ai-generated/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${type === 'video' ? 'mp4' : 'png'}`,
            createdAt: new Date().toISOString(),
            createdBy: req.user.id,
            createdByName: req.user.name
        };

        // Save to AI generation history
        const aiHistory = readData('ai-history');
        aiHistory.push(generatedContent);
        writeData('ai-history', aiHistory);

        // Also save as a video
        const video = {
            id: uuidv4(),
            title: `AI Generated: ${prompt.substring(0, 50)}...`,
            description: `AI generated ${type} based on: ${prompt}`,
            category: 'ai-generated',
            tags: ['ai', 'generated', style],
            isFeatured: true,
            videoUrl: generatedContent.url,
            fileData: generatedContent.imageData || '',
            sendTo: sendTo || 'both',
            likes: 0,
            views: 0,
            status: 'active',
            published: true,
            sentToUsers: true,
            createdBy: req.user.id,
            createdByName: req.user.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isAIGenerated: true,
            aiPrompt: prompt
        };

        addItem('videos', video);

        res.json({
            success: true,
            content: generatedContent,
            video: video,
            message: 'AI content generated and published successfully',
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

// Get all videos (Public)
exports.getVideos = async (req, res) => {
    try {
        const { category, featured, sendTo } = req.query;
        let videos = readData('videos');

        // Filter by category
        if (category) {
            videos = videos.filter(v => v.category === category);
        }

        // Filter by featured
        if (featured === 'true') {
            videos = videos.filter(v => v.isFeatured);
        }

        // Filter by sendTo (video section only)
        if (sendTo === 'video') {
            videos = videos.filter(v => v.sendTo === 'video' || v.sendTo === 'both');
        }

        // Filter by sendTo (carousel only)
        if (sendTo === 'carousel') {
            videos = videos.filter(v => v.sendTo === 'carousel' || v.sendTo === 'both');
        }

        // Sort by newest first
        videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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