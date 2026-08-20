const { readData, writeData, addItem, updateItem, findById, findUserByEmail, findUserById, getAllUsers } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// Get user's conversations
exports.getMyMessages = async (req, res) => {
    try {
        const conversations = readData('customer-care');
        const userMessages = conversations.filter(c => c.userId === req.user.id);
        res.json({ success: true, messages: userMessages || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send message (User)
exports.sendMessage = async (req, res) => {
    try {
        const { message, subject } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const conversation = {
            id: uuidv4(),
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            userPhone: req.user.phone || '',
            message: message,
            subject: subject || 'General Inquiry',
            sender: 'user',
            status: 'open',
            timestamp: new Date().toISOString(),
            read: false
        };

        addItem('customer-care', conversation);

        // Notify admins via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('new-customer-message', conversation);
        }

        res.status(201).json({ 
            success: true, 
            message: 'Message sent successfully', 
            conversation 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all conversations (Admin only)
exports.getAllConversations = async (req, res) => {
    try {
        const conversations = readData('customer-care');
        // Group by user
        const grouped = {};
        conversations.forEach(c => {
            if (!grouped[c.userId]) {
                grouped[c.userId] = {
                    userId: c.userId,
                    userName: c.userName,
                    userEmail: c.userEmail,
                    userPhone: c.userPhone || '',
                    messages: [],
                    status: 'open',
                    lastMessage: c.timestamp,
                    unread: 0
                };
            }
            grouped[c.userId].messages.push(c);
            if (c.timestamp > grouped[c.userId].lastMessage) {
                grouped[c.userId].lastMessage = c.timestamp;
            }
            if (!c.read && c.sender !== 'admin') {
                grouped[c.userId].unread++;
            }
        });

        const result = Object.values(grouped);
        res.json({ success: true, conversations: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Search conversations (Admin only) - NEW
exports.searchConversations = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ success: false, message: 'Search query is required' });
        }

        const conversations = readData('customer-care');
        const searchLower = query.toLowerCase();
        
        // Find users matching the search
        const matchedUsers = {};
        conversations.forEach(c => {
            const matchEmail = c.userEmail && c.userEmail.toLowerCase().includes(searchLower);
            const matchPhone = c.userPhone && c.userPhone.includes(query);
            const matchName = c.userName && c.userName.toLowerCase().includes(searchLower);
            
            if (matchEmail || matchPhone || matchName) {
                if (!matchedUsers[c.userId]) {
                    matchedUsers[c.userId] = {
                        userId: c.userId,
                        userName: c.userName,
                        userEmail: c.userEmail,
                        userPhone: c.userPhone || '',
                        messages: [],
                        status: 'open',
                        lastMessage: c.timestamp
                    };
                }
                matchedUsers[c.userId].messages.push(c);
                if (c.timestamp > matchedUsers[c.userId].lastMessage) {
                    matchedUsers[c.userId].lastMessage = c.timestamp;
                }
            }
        });

        res.json({ 
            success: true, 
            conversations: Object.values(matchedUsers),
            total: Object.keys(matchedUsers).length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get conversation with specific user (Admin only) - NEW
exports.getUserConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const conversations = readData('customer-care');
        const userMessages = conversations.filter(c => c.userId === userId);
        
        if (userMessages.length === 0) {
            return res.status(404).json({ success: false, message: 'No conversation found' });
        }

        // Mark messages as read
        userMessages.forEach(c => {
            if (c.sender === 'user' && !c.read) {
                c.read = true;
                c.readAt = new Date().toISOString();
            }
        });
        writeData('customer-care', conversations);

        res.json({ 
            success: true, 
            conversation: {
                userId: userMessages[0].userId,
                userName: userMessages[0].userName,
                userEmail: userMessages[0].userEmail,
                userPhone: userMessages[0].userPhone || '',
                messages: userMessages
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reply to conversation (Admin only)
exports.replyToConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // Get user info
        const user = findUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const reply = {
            id: uuidv4(),
            userId: userId,
            userName: user.name || 'Customer',
            userEmail: user.email || 'unknown',
            userPhone: user.phone || '',
            message: message,
            subject: 'Admin Reply',
            sender: 'admin',
            status: 'in-progress',
            timestamp: new Date().toISOString(),
            read: true
        };

        addItem('customer-care', reply);

        const io = req.app.get('io');
        if (io) {
            io.emit('admin-reply', reply);
            io.to(`user_${userId}`).emit('new-reply', reply);
        }

        res.json({ success: true, message: 'Reply sent successfully', reply });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Start new chat (Admin only) - NEW
exports.startChat = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = findUserById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if conversation exists
        const conversations = readData('customer-care');
        const existing = conversations.some(c => c.userId === userId);
        
        if (!existing) {
            // Create initial message
            const initialMessage = {
                id: uuidv4(),
                userId: userId,
                userName: user.name || 'Customer',
                userEmail: user.email || '',
                userPhone: user.phone || '',
                message: `Chat started by admin ${req.user.name}`,
                subject: 'Chat Started',
                sender: 'admin',
                status: 'open',
                timestamp: new Date().toISOString(),
                read: true
            };
            addItem('customer-care', initialMessage);
        }

        res.json({ 
            success: true, 
            message: 'Chat started successfully',
            userId: userId,
            userName: user.name
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Close conversation (Admin only)
exports.closeConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const conversations = readData('customer-care');
        const userConversations = conversations.filter(c => c.userId === userId);
        
        if (userConversations.length === 0) {
            return res.status(404).json({ success: false, message: 'No conversation found' });
        }

        userConversations.forEach(c => {
            c.status = 'closed';
            c.closedAt = new Date().toISOString();
            c.closedBy = req.user.id;
        });
        writeData('customer-care', conversations);

        res.json({ success: true, message: 'Conversation closed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};