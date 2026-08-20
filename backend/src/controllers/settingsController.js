const { readData, writeData } = require('../utils/fileHandler');

// Get contact info
exports.getContactInfo = async (req, res) => {
    try {
        const settings = readData('settings');
        const contact = settings.contact || {
            phone: '0716 335555',
            email: 'info@modernfurniturepacificltd.com',
            whatsapp: '+254 716 335 555',
            location: 'Ruiru, Behind Spur Mall',
            hoursWeek: '9:00AM - 10:00PM',
            hoursSun: '10:00AM - 6:00PM'
        };
        res.json({
            success: true,
            contact
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update contact info (Admin only)
exports.updateContactInfo = async (req, res) => {
    try {
        const { phone, email, whatsapp, location, hoursWeek, hoursSun } = req.body;
        const settings = readData('settings');

        settings.contact = {
            phone: phone || settings.contact?.phone || '0716 335555',
            email: email || settings.contact?.email || 'info@modernfurniturepacificltd.com',
            whatsapp: whatsapp || settings.contact?.whatsapp || '+254 716 335 555',
            location: location || settings.contact?.location || 'Ruiru, Behind Spur Mall',
            hoursWeek: hoursWeek || settings.contact?.hoursWeek || '9:00AM - 10:00PM',
            hoursSun: hoursSun || settings.contact?.hoursSun || '10:00AM - 6:00PM',
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
        };

        writeData('settings', settings);
        res.json({
            success: true,
            contact: settings.contact,
            message: 'Contact info updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get about us
exports.getAboutUs = async (req, res) => {
    try {
        const settings = readData('settings');
        const about = settings.about || {
            description: 'Modern Furniture Pacific is a premier furniture design and manufacturing company based in Kenya. With over 15 years of experience, we specialize in creating luxurious, handcrafted furniture that combines traditional craftsmanship with modern innovation.',
            mission: 'To provide exceptional furniture that combines quality, style, and affordability while ensuring customer satisfaction.',
            vision: 'To be the leading furniture provider in East Africa, known for innovation, quality, and customer service.',
            values: ['Quality', 'Innovation', 'Customer Satisfaction', 'Sustainability']
        };
        res.json({
            success: true,
            about
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update about us (Admin only)
exports.updateAboutUs = async (req, res) => {
    try {
        const { description, mission, vision, values } = req.body;
        const settings = readData('settings');

        settings.about = {
            description: description || settings.about?.description || '',
            mission: mission || settings.about?.mission || '',
            vision: vision || settings.about?.vision || '',
            values: values || settings.about?.values || [],
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
        };

        writeData('settings', settings);
        res.json({
            success: true,
            about: settings.about,
            message: 'About Us updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};