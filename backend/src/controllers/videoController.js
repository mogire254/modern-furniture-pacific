const { readData, writeData, addItem, updateItem, deleteItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');
const { generateAdOptions, generateVideoAd } = require('../utils/aiService');

// ============================================
// UPLOAD VIDEO
// ============================================
exports.uploadVideo = async (req, res) => {
    try {
        const { 
            title, description, note, category, 
            tags = [], isFeatured = false,
            fileData, fileName, fileType,
            sendTo = 'video', branch = 'all'
        } = req.body;

        if (!title || !fileData) {
            return res.status(400).json({
                success: false,
                message: 'Title and file data are required'
            });
        }

        const video = {
            id: uuidv4(),
            title,
            description: description || '',
            note: note || description || '',
            category: category || 'general',
            tags: tags || [],
            isFeatured,
            fileData,
            fileName: fileName || 'video.mp4',
            fileType: fileType || 'video',
            sendTo: sendTo || 'video',
            branch: branch || 'all',
            likes: 0,
            views: 0,
            status: 'active',
            published: true,
            sentToUsers: false,
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

// ============================================
// AI GENERATE AD (with video support)
// ============================================
exports.aiGenerateAd = async (req, res) => {
    try {
        const { 
            prompt, style, type, 
            imageUrl, sendTo = 'both'
        } = req.body;

        if (!prompt) {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required'
            });
        }

        const enhancedPrompt = enhancePrompt(prompt, style);

        if (!process.env.STABILITY_API_KEY) {
            console.warn('⚠️ STABILITY_API_KEY not set. Using mock generation.');
            const mockAds = generateMockAds(enhancedPrompt, style, type);
            return res.json({
                success: true,
                ads: mockAds,
                message: 'Demo ads generated (AI not configured)'
            });
        }

        let ads = [];

        if (type === 'video') {
            ads = await generateVideoAd(enhancedPrompt, style, imageUrl);
        } else {
            ads = await generateAdOptions(enhancedPrompt, style, type, imageUrl);
        }

        const aiHistory = readData('ai-history');
        const historyEntry = {
            id: uuidv4(),
            prompt: enhancedPrompt,
            originalPrompt: prompt,
            style,
            type,
            ads: ads.map(ad => ({ id: ad.id, title: ad.title })),
            createdAt: new Date().toISOString(),
            createdBy: req.user.id
        };
        aiHistory.push(historyEntry);
        writeData('ai-history', aiHistory);

        res.json({
            success: true,
            ads: ads,
            message: `${ads.length} ad options generated successfully!`
        });
    } catch (error) {
        console.error('❌ AI Generate Ad error:', error);
        const mockAds = generateMockAds(
            req.body.prompt || 'Ad', 
            req.body.style || 'modern', 
            req.body.type || 'image'
        );
        res.json({
            success: true,
            ads: mockAds,
            message: 'Demo ads generated (AI API error)'
        });
    }
};

// ============================================
// ENHANCE PROMPT
// ============================================
function enhancePrompt(prompt, style) {
    const styleWords = {
        'modern': 'sleek, contemporary, minimalist, clean lines',
        'luxury': 'premium, elegant, sophisticated, gold accents, high-end',
        'festive': 'colorful, celebratory, vibrant, joyful, exciting',
        'minimal': 'simple, clean, uncluttered, pure, essential',
        'bold': 'dramatic, eye-catching, striking, powerful, confident'
    };
    
    const styleDesc = styleWords[style] || 'modern, clean';
    
    return `Create a stunning ${style} style advertisement. ${prompt}. 
    The ad should be ${styleDesc}. Make it professional, high-quality, and visually appealing. 
    Use compelling language and imagery. Target audience: furniture buyers in Kenya.
    Include a clear call to action.`;
}

// ============================================
// MOCK ADS GENERATOR
// ============================================
function generateMockAds(prompt, style, type) {
    const styleNames = { 
        'modern': 'Modern & Clean', 
        'luxury': 'Luxury & Premium', 
        'festive': 'Festive & Colorful', 
        'minimal': 'Minimal & Simple', 
        'bold': 'Bold & Dynamic' 
    };
    const typeNames = { 
        'video': 'Video Ad', 
        'image': 'Image Ad', 
        'banner': 'Banner Ad' 
    };
    
    const styleName = styleNames[style] || 'Modern';
    const typeName = typeNames[type] || 'Image';
    
    const cartoonDesc = type === 'video' ? 
        '🎬 Animated cartoon character presenting the message' :
        '';
    
    return [
        { 
            id: 'ad1_' + Date.now(), 
            title: `${styleName} ${typeName} - Option 1${type === 'video' ? ' 🎬' : ''}`, 
            text: prompt, 
            style: style || 'modern', 
            type: type || 'image', 
            colors: style === 'modern' ? ['#1a2a3a', '#c9a94e', '#ffffff'] : 
                     style === 'luxury' ? ['#0d0d0d', '#c9a94e', '#ffffff'] : 
                     style === 'festive' ? ['#e63946', '#f59e0b', '#ffffff'] : 
                     style === 'minimal' ? ['#2d2d2d', '#888888', '#ffffff'] : 
                     ['#ef4444', '#1a2a3a', '#ffffff'], 
            preview: prompt.substring(0, 80) + (prompt.length > 80 ? '...' : ''), 
            uploadedFile: null, 
            fileName: null,
            isVideo: type === 'video',
            cartoonDesc: cartoonDesc
        },
        { 
            id: 'ad2_' + Date.now(), 
            title: `${styleName} ${typeName} - Option 2${type === 'video' ? ' 🎬' : ''}`, 
            text: prompt, 
            style: style || 'modern', 
            type: type || 'image', 
            colors: style === 'modern' ? ['#2d4a6a', '#e8d5a3', '#1a2a3a'] : 
                     style === 'luxury' ? ['#1a1a1a', '#d4af37', '#ffffff'] : 
                     style === 'festive' ? ['#d62828', '#ffb347', '#ffffff'] : 
                     style === 'minimal' ? ['#f5f5f5', '#333333', '#888888'] : 
                     ['#dc2626', '#f59e0b', '#1a2a3a'], 
            preview: prompt.substring(0, 80) + (prompt.length > 80 ? '...' : ''), 
            uploadedFile: null, 
            fileName: null,
            isVideo: type === 'video',
            cartoonDesc: type === 'video' ? '📺 Animated character explaining the offer' : ''
        },
        { 
            id: 'ad3_' + Date.now(), 
            title: `${styleName} ${typeName} - Option 3${type === 'video' ? ' 🎬' : ''}`, 
            text: prompt, 
            style: style || 'modern', 
            type: type || 'image', 
            colors: style === 'modern' ? ['#c9a94e', '#1a2a3a', '#ffffff'] : 
                     style === 'luxury' ? ['#b8860b', '#1a1a1a', '#ffffff'] : 
                     style === 'festive' ? ['#ff6b6b', '#ffd93d', '#ffffff'] : 
                     style === 'minimal' ? ['#e8e8e8', '#1a1a2a', '#888888'] : 
                     ['#f59e0b', '#1a2a3a', '#ffffff'], 
            preview: prompt.substring(0, 80) + (prompt.length > 80 ? '...' : ''), 
            uploadedFile: null, 
            fileName: null,
            isVideo: type === 'video',
            cartoonDesc: type === 'video' ? '🎭 Cartoon mascot delivering the message' : ''
        }
    ];
}

// ============================================
// GET ALL VIDEOS
// ============================================
exports.getVideos = async (req, res) => {
    try {
        const { category, featured, sendTo } = req.query;
        let videos = readData('videos');

        if (category) {
            videos = videos.filter(v => v.category === category);
        }

        if (featured === 'true') {
            videos = videos.filter(v => v.isFeatured);
        }

        if (sendTo === 'video') {
            videos = videos.filter(v => v.sendTo === 'video' || v.sendTo === 'both');
        }
        if (sendTo === 'carousel') {
            videos = videos.filter(v => v.sendTo === 'carousel' || v.sendTo === 'both');
        }

        // Only show published videos
        videos = videos.filter(v => v.published === true);

        videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            videos,
            total: videos.length
        });
    } catch (error) {
        console.error('❌ Get videos error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET SINGLE VIDEO
// ============================================
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

        video.views = (video.views || 0) + 1;
        updateItem('videos', id, video);

        res.json({
            success: true,
            video
        });
    } catch (error) {
        console.error('❌ Get video error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// VIEW VIDEO (increment view count)
// ============================================
exports.viewVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const video = findById('videos', id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        video.views = (video.views || 0) + 1;
        updateItem('videos', id, video);

        res.json({
            success: true,
            views: video.views,
            message: 'View counted'
        });
    } catch (error) {
        console.error('❌ View video error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// UPDATE VIDEO
// ============================================
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
        console.error('❌ Update video error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// DELETE VIDEO
// ============================================
exports.deleteVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const video = findById('videos', id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }

        deleteItem('videos', id);

        res.json({
            success: true,
            message: 'Video deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete video error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// LIKE VIDEO
// ============================================
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
        console.error('❌ Like video error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET AI HISTORY
// ============================================
exports.getAIHistory = async (req, res) => {
    try {
        const aiHistory = readData('ai-history');
        res.json({
            success: true,
            history: aiHistory || []
        });
    } catch (error) {
        console.error('❌ Get AI history error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// DOWNLOAD AD
// ============================================
exports.downloadAd = async (req, res) => {
    try {
        const { id } = req.params;
        const { imageData, filename } = req.body;

        if (!imageData) {
            return res.status(400).json({
                success: false,
                message: 'Image data is required'
            });
        }

        const buffer = Buffer.from(imageData, 'base64');

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename=${filename || 'ad.png'}`);
        res.send(buffer);
    } catch (error) {
        console.error('❌ Download ad error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};