const { readData, writeData, addItem, updateItem, deleteItem, findById, findUserById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// ============================================
// JOB POSTINGS (Admin)
// ============================================

// Get all job postings (Public)
exports.getJobs = async (req, res) => {
    try {
        const jobs = readData('applications');
        res.json({
            success: true,
            jobs: jobs || []
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create job posting (Admin only)
exports.createJob = async (req, res) => {
    try {
        const { 
            title, location, type, deadline, description, 
            isOpen, quizQuestions, requiredFields, optionalFields,
            requireResume, requireCertificates, requireId, requirePortfolio
        } = req.body;

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
            quizQuestions: quizQuestions || [],
            requiredFields: requiredFields || ['name', 'email', 'phone', 'experience'],
            optionalFields: optionalFields || ['coverLetter', 'portfolio'],
            requireResume: requireResume !== undefined ? requireResume : true,
            requireCertificates: requireCertificates || false,
            requireId: requireId || false,
            requirePortfolio: requirePortfolio || false,
            applicants: [],
            createdAt: new Date().toISOString(),
            createdBy: req.user.id,
            createdByName: req.user.name,
            updatedAt: new Date().toISOString()
        };

        addItem('applications', job);
        res.status(201).json({ success: true, job, message: 'Job posting created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update job posting (Admin only)
exports.updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const job = findById('applications', id);
        
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const updatedJob = { ...job, ...updates, updatedAt: new Date().toISOString() };
        updateItem('applications', id, updatedJob);
        res.json({ success: true, job: updatedJob, message: 'Job updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete job posting (Admin only)
exports.deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        deleteItem('applications', id);
        res.json({ success: true, message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle job status (Admin only)
exports.toggleJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isOpen } = req.body;
        const job = findById('applications', id);
        
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        job.isOpen = isOpen;
        job.updatedAt = new Date().toISOString();
        updateItem('applications', id, job);
        res.json({ success: true, job, message: `Job ${isOpen ? 'opened' : 'closed'}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// JOB APPLICATIONS (Users)
// ============================================

// Apply for a job (User)
exports.applyForJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, experience, coverLetter, portfolio, quizAnswers, files } = req.body;

        const job = findById('applications', id);
        
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (!job.isOpen) {
            return res.status(400).json({ success: false, message: 'Applications are closed for this position' });
        }

        // Check if already applied
        if (job.applicants && job.applicants.some(a => a.userEmail === email)) {
            return res.status(400).json({ success: false, message: 'You have already applied for this position' });
        }

        const application = {
            id: uuidv4(),
            jobId: id,
            jobTitle: job.title,
            userId: req.user.id,
            userName: name || req.user.name,
            userEmail: email || req.user.email,
            userPhone: phone || req.user.phone || '',
            experience: experience || '',
            coverLetter: coverLetter || '',
            portfolio: portfolio || '',
            quizAnswers: quizAnswers || [],
            files: files || {},
            status: 'pending',
            appliedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (!job.applicants) job.applicants = [];
        job.applicants.push(application);
        updateItem('applications', id, job);

        // Notify admins
        console.log(`📝 New application for ${job.title} from ${application.userName}`);
        console.log(`📧 Email: ${application.userEmail}`);

        res.status(201).json({ 
            success: true, 
            application, 
            message: '✅ Thank you for your application! Please check your email daily for feedback.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get applicants for a job (Admin only)
exports.getApplicants = async (req, res) => {
    try {
        const { id } = req.params;
        const job = findById('applications', id);
        
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        res.json({ success: true, applicants: job.applicants || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// REVIEW APPLICATION (Admin)
// ============================================

// Approve application (Admin only)
exports.approveApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;

        // Find which job has this applicant
        const jobs = readData('applications');
        let foundJob = null;
        let foundApplicant = null;
        let jobIndex = -1;
        let applicantIndex = -1;

        for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i];
            if (job.applicants) {
                const idx = job.applicants.findIndex(a => a.id === id);
                if (idx !== -1) {
                    foundJob = job;
                    foundApplicant = job.applicants[idx];
                    jobIndex = i;
                    applicantIndex = idx;
                    break;
                }
            }
        }

        if (!foundJob || !foundApplicant) {
            return res.status(404).json({ success: false, message: 'Applicant not found' });
        }

        foundApplicant.status = 'approved';
        foundApplicant.feedback = feedback || 'Congratulations! Your application has been approved.';
        foundApplicant.reviewedAt = new Date().toISOString();
        foundApplicant.reviewedBy = req.user.id;

        jobs[jobIndex].applicants[applicantIndex] = foundApplicant;
        writeData('applications', jobs);

        // Send email notification (in production, use nodemailer)
        console.log(`📧 Approved notification sent to ${foundApplicant.userEmail}`);
        console.log(`🎉 Message: ${foundApplicant.feedback}`);

        res.json({ 
            success: true, 
            applicant: foundApplicant, 
            message: 'Applicant approved successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reject application (Admin only)
exports.rejectApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;

        // Find which job has this applicant
        const jobs = readData('applications');
        let foundJob = null;
        let foundApplicant = null;
        let jobIndex = -1;
        let applicantIndex = -1;

        for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i];
            if (job.applicants) {
                const idx = job.applicants.findIndex(a => a.id === id);
                if (idx !== -1) {
                    foundJob = job;
                    foundApplicant = job.applicants[idx];
                    jobIndex = i;
                    applicantIndex = idx;
                    break;
                }
            }
        }

        if (!foundJob || !foundApplicant) {
            return res.status(404).json({ success: false, message: 'Applicant not found' });
        }

        foundApplicant.status = 'rejected';
        foundApplicant.feedback = feedback || 'After careful review, we regret to inform you that your application has not been successful.';
        foundApplicant.reviewedAt = new Date().toISOString();
        foundApplicant.reviewedBy = req.user.id;

        jobs[jobIndex].applicants[applicantIndex] = foundApplicant;
        writeData('applications', jobs);

        // Send email notification (in production, use nodemailer)
        console.log(`📧 Rejection notification sent to ${foundApplicant.userEmail}`);
        console.log(`📝 Message: ${foundApplicant.feedback}`);

        res.json({ 
            success: true, 
            applicant: foundApplicant, 
            message: 'Applicant rejected'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// APPLICATION SETTINGS (CEO Admin)
// ============================================

// Get application settings
exports.getSettings = async (req, res) => {
    try {
        const settings = readData('settings');
        const appSettings = settings.applications || {
            isOpen: false,
            openDate: null,
            closeDate: null,
            message: 'Applications are currently closed. Please check back for future openings.'
        };
        res.json({ success: true, settings: appSettings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update application settings (CEO Admin only)
exports.updateSettings = async (req, res) => {
    try {
        const { isOpen, openDate, closeDate, message } = req.body;
        const settings = readData('settings');

        settings.applications = {
            isOpen: isOpen !== undefined ? isOpen : settings.applications?.isOpen || false,
            openDate: openDate || settings.applications?.openDate || null,
            closeDate: closeDate || settings.applications?.closeDate || null,
            message: message || settings.applications?.message || 'Applications are currently closed.',
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
        };

        writeData('settings', settings);
        res.json({
            success: true,
            settings: settings.applications,
            message: `Applications ${isOpen ? 'opened' : 'closed'} successfully`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};