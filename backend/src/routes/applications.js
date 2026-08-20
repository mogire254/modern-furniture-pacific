const express = require('express');
const router = express.Router();
const { protect, isAdmin, isCEOAdmin } = require('../middleware/auth');
const applicationController = require('../controllers/applicationController');

// ===== JOB POSTINGS (Admin creates jobs) =====
router.get('/', applicationController.getJobs);
router.post('/', protect, isAdmin, applicationController.createJob);
router.put('/:id', protect, isAdmin, applicationController.updateJob);
router.delete('/:id', protect, isAdmin, applicationController.deleteJob);
router.patch('/:id/status', protect, isAdmin, applicationController.toggleJobStatus);

// ===== JOB APPLICATIONS (Users apply) =====
router.post('/:id/apply', protect, applicationController.applyForJob);
router.get('/:id/applicants', protect, isAdmin, applicationController.getApplicants);

// ===== REVIEW APPLICATION (Admin) =====
router.patch('/applicant/:id/approve', protect, isAdmin, applicationController.approveApplication);
router.patch('/applicant/:id/reject', protect, isAdmin, applicationController.rejectApplication);

// ===== APPLICATION SETTINGS =====
router.get('/settings', applicationController.getSettings);
router.put('/settings', protect, isCEOAdmin, applicationController.updateSettings);

module.exports = router;