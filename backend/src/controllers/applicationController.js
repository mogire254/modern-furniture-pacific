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
            requireResume, requireCertificates, requireId, requirePortfolio,
            phoneRequired, locationRequired, experienceRequired, coverRequired
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
            requiredFields: requiredFields || ['name', 'email'],
            optionalFields: optionalFields || ['phone', 'location', 'experience', 'coverLetter', 'portfolio'],
            phoneRequired: phoneRequired || false,
            locationRequired: locationRequired || false,
            experienceRequired: experienceRequired || false,
            coverRequired: coverRequired || false,
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
// JOB APPLICATIONS (Users) - FIXED with all fields
// ============================================

// Apply for a job (User)
exports.applyForJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, email, phone, location, experience, 
            coverLetter, portfolio, quizAnswers, 
            files = {}
        } = req.body;

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

        // Validate required fields
        const errors = [];
        if (!name || name.trim() === '') errors.push('Full name is required');
        if (!email || !email.includes('@')) errors.push('Valid email is required');
        if (job.phoneRequired && (!phone || phone.trim() === '')) errors.push('Phone number is required');
        if (job.locationRequired && (!location || location.trim() === '')) errors.push('Location is required');
        if (job.experienceRequired && (!experience || experience.trim() === '')) errors.push('Experience is required');
        if (job.coverRequired && (!coverLetter || coverLetter.trim() === '')) errors.push('Cover letter is required');
        if (job.requireResume && !files.resume) errors.push('Resume is required');
        if (job.requireCertificates && !files.certificates) errors.push('Academic certificates are required');
        if (job.requireId && !files.idDocument) errors.push('ID document is required');
        
        if (errors.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please fill all required fields',
                errors: errors 
            });
        }

        const application = {
            id: uuidv4(),
            jobId: id,
            jobTitle: job.title,
            userId: req.user.id,
            userName: name.trim(),
            userEmail: email.trim(),
            userPhone: phone || '',
            location: location || '',
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

        console.log(`📝 New application for ${job.title} from ${application.userName}`);
        console.log(`📧 Email: ${application.userEmail}`);

        res.status(201).json({ 
            success: true, 
            application, 
            message: '✅ Thank you for your application! Please check your email daily for feedback.'
        });
    } catch (error) {
        console.error('❌ Apply error:', error);
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
// REVIEW APPLICATION (Admin) - with email/notification
// ============================================

// Approve application (Admin only)
exports.approveApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;

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
        foundApplicant.feedback = feedback || '🎉 Congratulations! Your application has been approved. We will contact you shortly with next steps.';
        foundApplicant.reviewedAt = new Date().toISOString();
        foundApplicant.reviewedBy = req.user.id;

        jobs[jobIndex].applicants[applicantIndex] = foundApplicant;
        writeData('applications', jobs);

        // Create notification for user
        const notification = {
            id: uuidv4(),
            userId: foundApplicant.userId,
            type: 'application_approved',
            title: '🎉 Application Approved!',
            message: `Dear ${foundApplicant.userName},\n\nCongratulations! Your application for ${foundJob.title} has been approved.\n\n${foundApplicant.feedback}\n\nWe will contact you shortly with more details.\n\n📞 WhatsApp: +254 716 335555\n📧 Email: info@modernfurniturepacificltd.com`,
            read: false,
            createdAt: new Date().toISOString()
        };
        addItem('notifications', notification);

        const io = req.app.get('io');
        if (io) {
            io.to(`user_${foundApplicant.userId}`).emit('new-notification', notification);
        }

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
        foundApplicant.feedback = feedback || 'After careful review, we regret to inform you that your application has not been successful at this time. We encourage you to apply for future opportunities.';
        foundApplicant.reviewedAt = new Date().toISOString();
        foundApplicant.reviewedBy = req.user.id;

        jobs[jobIndex].applicants[applicantIndex] = foundApplicant;
        writeData('applications', jobs);

        // Create notification for user
        const notification = {
            id: uuidv4(),
            userId: foundApplicant.userId,
            type: 'application_rejected',
            title: '📋 Application Update',
            message: `Dear ${foundApplicant.userName},\n\nThank you for applying for ${foundJob.title}.\n\n${foundApplicant.feedback}\n\nWe appreciate your interest in joining our team and encourage you to apply for future positions.\n\nWishing you all the best!`,
            read: false,
            createdAt: new Date().toISOString()
        };
        addItem('notifications', notification);

        const io = req.app.get('io');
        if (io) {
            io.to(`user_${foundApplicant.userId}`).emit('new-notification', notification);
        }

        console.log(`📧 Rejection notification sent to ${foundApplicant.userEmail}`);

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