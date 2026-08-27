const { readData, writeData, addItem, updateItem, findById, findUserById, getAllUsers } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// ============================================
// ===== FIXED: SEARCH ALL USERS (not just conversations) =====
// ============================================
exports.searchConversations = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const conversations = readData('customer-care') || [];
        const allUsers = readData('users') || [];
        const searchLower = query.toLowerCase().trim();
        const matchedUsers = {};
        
        // Search in existing conversations
        conversations.forEach(c => {
            const matchEmail = c.userEmail && c.userEmail.toLowerCase().includes(searchLower);
            const matchPhone = c.userPhone && c.userPhone.includes(query);
            const matchName = c.userName && c.userName.toLowerCase().includes(searchLower);
            
            if (matchEmail || matchPhone || matchName) {
                if (!matchedUsers[c.userId]) {
                    matchedUsers[c.userId] = {
                        userId: c.userId,
                        userName: c.userName || 'User',
                        userEmail: c.userEmail || '',
                        userPhone: c.userPhone || '',
                        messages: [],
                        status: 'open',
                        lastMessage: c.timestamp,
                        hasChat: true,
                        branch: c.branch || 'all'
                    };
                }
                matchedUsers[c.userId].messages.push(c);
            }
        });
        
        // ===== NEW: Search ALL users (including those without chats) =====
        allUsers.forEach(u => {
            const matchEmail = u.email && u.email.toLowerCase().includes(searchLower);
            const matchPhone = u.phone && u.phone.includes(query);
            const matchName = u.name && u.name.toLowerCase().includes(searchLower);
            
            if (matchEmail || matchPhone || matchName) {
                if (!matchedUsers[u.id]) {
                    matchedUsers[u.id] = {
                        userId: u.id,
                        userName: u.name || 'User',
                        userEmail: u.email || '',
                        userPhone: u.phone || '',
                        messages: [],
                        status: 'new',
                        lastMessage: null,
                        hasChat: false,
                        branch: u.branch || 'all'
                    };
                }
            }
        });

        // Sort results - users with chats first
        const results = Object.values(matchedUsers);
        results.sort((a, b) => {
            if (a.hasChat && !b.hasChat) return -1;
            if (!a.hasChat && b.hasChat) return 1;
            return 0;
        });

        res.json({
            success: true,
            conversations: results,
            total: results.length,
            searched: query
        });
    } catch (error) {
        console.error('❌ Search conversations error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET ALL CONVERSATIONS (Admin only)
// ============================================
exports.getAllConversations = async (req, res) => {
    try {
        const conversations = readData('customer-care') || [];
        const grouped = {};

        conversations.forEach(c => {
            if (!grouped[c.userId]) {
                grouped[c.userId] = {
                    id: c.userId || 'unknown',
                    userId: c.userId,
                    userName: c.userName || 'Guest',
                    userEmail: c.userEmail || '',
                    userPhone: c.userPhone || '',
                    status: c.status || 'open',
                    messages: [],
                    branch: c.branch || 'all',
                    createdAt: c.createdAt || new Date().toISOString()
                };
            }
            grouped[c.userId].messages.push(c);
        });

        const result = Object.values(grouped);
        result.sort((a, b) => {
            const lastA = a.messages[a.messages.length - 1]?.timestamp || a.createdAt;
            const lastB = b.messages[b.messages.length - 1]?.timestamp || b.createdAt;
            return new Date(lastB) - new Date(lastA);
        });

        res.json({
            success: true,
            conversations: result,
            total: result.length
        });
    } catch (error) {
        console.error('❌ Get all conversations error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET USER CONVERSATION
// ============================================
exports.getUserConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const conversations = readData('customer-care') || [];
        const user = findUserById('users', userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userMessages = conversations.filter(c => c.userId === userId);

        const conversation = {
            userId: user.id,
            userName: user.name || 'User',
            userEmail: user.email || '',
            userPhone: user.phone || '',
            branch: user.branch || 'all',
            messages: userMessages,
            status: userMessages.length > 0 ? userMessages[userMessages.length - 1]?.status || 'open' : 'new'
        };

        res.json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error('❌ Get user conversation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// ===== FIXED: REPLY TO CONVERSATION =====
// ============================================
exports.replyToConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        const user = findUserById('users', userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const reply = {
            id: uuidv4(),
            userId: user.id,
            userName: user.name || 'User',
            userEmail: user.email || '',
            userPhone: user.phone || '',
            sender: 'admin',
            adminName: req.user.name || 'Admin',
            message: message.trim(),
            status: 'open',
            branch: user.branch || 'all',
            timestamp: new Date().toISOString(),
            read: false
        };

        addItem('customer-care', reply);

        // ===== NEW: Create notification for user =====
        const notification = {
            id: uuidv4(),
            userId: user.id,
            type: 'customer_care_reply',
            title: '📩 New Reply from Support',
            message: `Admin replied to your message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
            read: false,
            createdAt: new Date().toISOString()
        };
        addItem('notifications', notification);

        // Send via socket if available
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${user.id}`).emit('new-notification', notification);
            io.to(`user_${user.id}`).emit('new-care-message', reply);
        }

        console.log(`✅ Admin replied to ${user.name} (${user.email})`);
        console.log(`💬 Message: ${message}`);

        res.json({
            success: true,
            reply,
            message: '✅ Reply sent successfully!'
        });
    } catch (error) {
        console.error('❌ Reply to conversation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// USER SEND MESSAGE
// ============================================
exports.sendMessage = async (req, res) => {
    try {
        const { message, subject } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        const msg = {
            id: uuidv4(),
            userId: req.user.id,
            userName: req.user.name || 'User',
            userEmail: req.user.email || '',
            userPhone: req.user.phone || '',
            sender: 'user',
            message: message.trim(),
            subject: subject || 'General Inquiry',
            status: 'open',
            branch: req.user.branch || 'all',
            timestamp: new Date().toISOString(),
            read: false
        };

        addItem('customer-care', msg);

        // ===== NEW: Notify all admins =====
        const admins = readData('admins') || [];
        const io = req.app.get('io');
        if (io) {
            admins.forEach(admin => {
                io.to(`admin_${admin.id}`).emit('new-care-message', msg);
            });
        }

        console.log(`📩 New message from ${req.user.name} (${req.user.email})`);
        console.log(`💬 ${message}`);

        res.status(201).json({
            success: true,
            message: msg,
            msg: 'Message sent! Our team will respond shortly.'
        });
    } catch (error) {
        console.error('❌ Send message error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// GET MY MESSAGES (User)
// ============================================
exports.getMyMessages = async (req, res) => {
    try {
        const conversations = readData('customer-care') || [];
        const myMessages = conversations.filter(c => c.userId === req.user.id);

        // Mark messages as read
        myMessages.forEach(msg => {
            if (msg.sender === 'admin' && !msg.read) {
                msg.read = true;
                updateItem('customer-care', msg.id, msg);
            }
        });

        res.json({
            success: true,
            messages: myMessages,
            total: myMessages.length
        });
    } catch (error) {
        console.error('❌ Get my messages error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// START CHAT (Admin)
// ============================================
exports.startChat = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = findUserById('users', userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if chat already exists
        const conversations = readData('customer-care') || [];
        const existing = conversations.find(c => c.userId === userId);
        
        if (existing) {
            return res.json({
                success: true,
                message: 'Chat already exists',
                conversation: existing
            });
        }

        // Create initial message
        const starter = {
            id: uuidv4(),
            userId: user.id,
            userName: user.name || 'User',
            userEmail: user.email || '',
            userPhone: user.phone || '',
            sender: 'admin',
            adminName: req.user.name || 'Admin',
            message: `👋 Hello ${user.name || 'User'}! How can we help you today?`,
            status: 'open',
            branch: user.branch || 'all',
            timestamp: new Date().toISOString(),
            read: false
        };

        addItem('customer-care', starter);

        // Notify user
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${user.id}`).emit('new-care-message', starter);
        }

        console.log(`💬 Admin started chat with ${user.name} (${user.email})`);

        res.json({
            success: true,
            conversation: starter,
            message: '✅ Chat started!'
        });
    } catch (error) {
        console.error('❌ Start chat error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ============================================
// CLOSE CONVERSATION (Admin)
// ============================================
exports.closeConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const conversations = readData('customer-care') || [];
        const userMessages = conversations.filter(c => c.userId === userId);

        if (userMessages.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No conversation found for this user'
            });
        }

        // Update all messages for this user to closed
        userMessages.forEach(msg => {
            msg.status = 'closed';
            updateItem('customer-care', msg.id, msg);
        });

        // Add closure message
        const closure = {
            id: uuidv4(),
            userId: userId,
            userName: userMessages[0].userName || 'User',
            userEmail: userMessages[0].userEmail || '',
            userPhone: userMessages[0].userPhone || '',
            sender: 'admin',
            adminName: req.user.name || 'Admin',
            message: '✅ This conversation has been closed. Feel free to start a new chat if you need further assistance.',
            status: 'closed',
            branch: userMessages[0].branch || 'all',
            timestamp: new Date().toISOString(),
            read: false
        };
        addItem('customer-care', closure);

        // Notify user
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${userId}`).emit('chat-closed', { userId });
        }

        console.log(`🔒 Conversation closed with ${userMessages[0].userName}`);

        res.json({
            success: true,
            message: '✅ Conversation closed successfully'
        });
    } catch (error) {
        console.error('❌ Close conversation error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};