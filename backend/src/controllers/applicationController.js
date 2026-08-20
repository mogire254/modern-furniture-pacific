const { readData, writeData, addItem, updateItem, findById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

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
        res.json({
            success: true,
            settings: appSettings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update application settings (Admin only)
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Submit application
exports.submitApplication = async (req, res) => {
    try {
        const { position, experience, skills, coverLetter, cvUrl } = req.body;

        // Check if applications are open
        const settings = readData('settings');
        const appSettings = settings.applications || { isOpen: false };

        if (!appSettings.isOpen) {
            return res.status(400).json({
                success: false,
                message: appSettings.message || 'Applications are currently closed. Please check back for future openings.'
            });
        }

        // Check if close date passed
        if (appSettings.closeDate && new Date(appSettings.closeDate) < new Date()) {
            appSettings.isOpen = false;
            settings.applications = appSettings;
            writeData('settings', settings);
            return res.status(400).json({
                success: false,
                message: 'Application period has ended. Please check back for future openings.'
            });
        }

        if (!position || !experience) {
            return res.status(400).json({
                success: false,
                message: 'Position and experience are required'
            });
        }

        const application = {
            id: uuidv4(),
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            userPhone: req.user.phone || '',
            position,
            experience,
            skills: skills || '',
            coverLetter: coverLetter || '',
            cvUrl: cvUrl || '',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        addItem('applications', application);

        // Notify CEO admin
        console.log(`📝 New application from ${req.user.name} for ${position}`);

        res.status(201).json({
            success: true,
            application,
            message: 'Application submitted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all applications (Admin only)
exports.getApplications = async (req, res) => {
    try {
        const { status } = req.query;
        let applications = readData('applications');

        if (status) {
            applications = applications.filter(a => a.status === status);
        }

        res.json({
            success: true,
            applications,
            total: applications.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user's applications
exports.getMyApplications = async (req, res) => {
    try {
        const applications = readData('applications');
        const userApps = applications.filter(a => a.userId === req.user.id);
        res.json({
            success: true,
            applications: userApps
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update application status (Admin only)
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, feedback } = req.body;

        const application = findById('applications', id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        application.status = status;
        application.feedback = feedback || '';
        application.updatedAt = new Date().toISOString();
        application.reviewedBy = req.user.id;

        updateItem('applications', id, application);

        res.json({
            success: true,
            application,
            message: `Application ${status}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};