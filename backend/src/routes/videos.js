const express = require('express');
const router = express.Router();
const { protect, isAdmin, isSuperAdmin } = require('../middleware/auth');
const videoController = require('../controllers/videoController');

// ============================================
// PUBLIC ROUTES - Anyone can view
// ============================================

// Get all videos (with filters)
router.get('/', videoController.getVideos);

// Get single video
router.get('/:id', videoController.getVideo);

// Like a video (public)
router.post('/:id/like', videoController.likeVideo);

// ===== FIXED: View a video (increment view count) =====
// Changed from getVideo to viewVideo
router.post('/:id/view', videoController.viewVideo);

// ============================================
// ADMIN ROUTES - Any admin
// ============================================

// Upload video (Admin only)
router.post('/', protect, isAdmin, videoController.uploadVideo);

// Update video (Admin only)
router.put('/:id', protect, isAdmin, videoController.updateVideo);

// Delete video (Admin only)
router.delete('/:id', protect, isAdmin, videoController.deleteVideo);

// ============================================
// SUPER ADMIN AI ROUTES - Super Admin only
// ============================================

// Generate ad with AI (Super Admin only)
router.post('/ai-generate', protect, isSuperAdmin, videoController.aiGenerateAd);

// Get AI generation history (Super Admin only)
router.get('/ai-history', protect, isSuperAdmin, videoController.getAIHistory);

// Download generated ad (Super Admin only)
router.post('/:id/download', protect, isSuperAdmin, videoController.downloadAd);

module.exports = router;