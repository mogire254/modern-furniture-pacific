const { readData, writeData, addItem, findUserById, getAllUsers } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

module.exports = (io) => {
    const adminNamespace = io.of('/admin-chat');

    adminNamespace.on('connection', (socket) => {
        console.log('🔗 Admin connected to admin chat:', socket.id);

        // Join admin room
        socket.on('join-admin', (adminId) => {
            socket.join(`admin_${adminId}`);
            console.log(`👤 Admin ${adminId} joined admin chat`);
            
            // Send online status
            adminNamespace.emit('admin-online', { adminId, status: 'online' });
        });

        // Send message with @mentions
        socket.on('send-message', async (data) => {
            try {
                const { fromAdminId, toAdminId, message, type = 'text', mentions = [] } = data;

                // Process mentions - extract @username from message
                const mentionRegex = /@(\w+)/g;
                const foundMentions = [];
                let match;
                while ((match = mentionRegex.exec(message)) !== null) {
                    foundMentions.push(match[1]);
                }

                // Merge with provided mentions
                const allMentions = [...new Set([...mentions, ...foundMentions])];

                const chatMessage = {
                    id: uuidv4(),
                    fromAdminId,
                    toAdminId: toAdminId || 'all',
                    message,
                    type,
                    mentions: allMentions,
                    status: 'sent',
                    read: false,
                    createdAt: new Date().toISOString()
                };

                // Save to database
                const chatHistory = readData('admin-chat');
                chatHistory.push(chatMessage);
                writeData('admin-chat', chatHistory);

                // Send to specific admin if mentioned
                if (toAdminId) {
                    adminNamespace.to(`admin_${toAdminId}`).emit('receive-message', chatMessage);
                } else {
                    // Send to all admins
                    adminNamespace.emit('receive-message', chatMessage);
                }

                // Send back to sender
                socket.emit('message-sent', chatMessage);

                // Process @mentions
                allMentions.forEach(mention => {
                    // Find admin by name
                    const admins = getAllUsers().filter(u => u.isAdmin);
                    const mentionedAdmin = admins.find(a => 
                        a.name.toLowerCase().includes(mention.toLowerCase()) ||
                        a.email.toLowerCase().includes(mention.toLowerCase())
                    );
                    
                    if (mentionedAdmin) {
                        // Send notification to mentioned admin
                        adminNamespace.to(`admin_${mentionedAdmin.id}`).emit('mentioned', {
                            from: fromAdminId,
                            message: `You were mentioned by ${data.fromAdminName || 'Admin'}: ${message}`,
                            chatMessage: chatMessage
                        });
                        console.log(`📢 Admin ${fromAdminId} mentioned @${mention}`);
                    }
                });

                console.log(`💬 Admin message from ${fromAdminId} to ${toAdminId || 'all'}`);
            } catch (error) {
                console.error('❌ Admin chat error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Reply to specific message
        socket.on('reply-to-message', async (data) => {
            try {
                const { messageId, fromAdminId, toAdminId, replyMessage } = data;

                // Get original message
                const chatHistory = readData('admin-chat');
                const originalMessage = chatHistory.find(m => m.id === messageId);
                
                if (!originalMessage) {
                    socket.emit('error', { message: 'Original message not found' });
                    return;
                }

                const reply = {
                    id: uuidv4(),
                    fromAdminId,
                    toAdminId: originalMessage.fromAdminId,
                    message: `↳ Reply to: ${originalMessage.message}\n\n${replyMessage}`,
                    type: 'reply',
                    replyTo: messageId,
                    originalMessage: originalMessage.message,
                    status: 'sent',
                    read: false,
                    createdAt: new Date().toISOString()
                };

                chatHistory.push(reply);
                writeData('admin-chat', chatHistory);

                // Send to specific admin
                adminNamespace.to(`admin_${originalMessage.fromAdminId}`).emit('receive-message', reply);
                
                // Send back to sender
                socket.emit('message-sent', reply);

                console.log(`💬 Reply from ${fromAdminId} to ${originalMessage.fromAdminId}`);
            } catch (error) {
                console.error('❌ Reply error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Edit message
        socket.on('edit-message', async (data) => {
            try {
                const { messageId, newMessage, adminId } = data;
                const chatHistory = readData('admin-chat');
                const messageIndex = chatHistory.findIndex(m => m.id === messageId);
                
                if (messageIndex !== -1) {
                    chatHistory[messageIndex].message = newMessage;
                    chatHistory[messageIndex].edited = true;
                    chatHistory[messageIndex].editedAt = new Date().toISOString();
                    chatHistory[messageIndex].editedBy = adminId;
                    writeData('admin-chat', chatHistory);
                    
                    adminNamespace.emit('message-edited', chatHistory[messageIndex]);
                }
            } catch (error) {
                console.error('❌ Edit message error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Mark as read
        socket.on('mark-read', async (data) => {
            try {
                const { messageId, adminId } = data;
                const chatHistory = readData('admin-chat');
                const messageIndex = chatHistory.findIndex(m => m.id === messageId);
                
                if (messageIndex !== -1) {
                    chatHistory[messageIndex].read = true;
                    chatHistory[messageIndex].readAt = new Date().toISOString();
                    writeData('admin-chat', chatHistory);
                    
                    socket.emit('message-read', { messageId, adminId });
                }
            } catch (error) {
                console.error('❌ Mark read error:', error);
            }
        });

        // Get admin chat history
        socket.on('get-history', async (data) => {
            try {
                const { adminId, otherAdminId } = data;
                const chatHistory = readData('admin-chat');
                
                let messages = chatHistory;
                if (otherAdminId) {
                    messages = chatHistory.filter(m => 
                        (m.fromAdminId === adminId && m.toAdminId === otherAdminId) ||
                        (m.fromAdminId === otherAdminId && m.toAdminId === adminId) ||
                        (m.toAdminId === 'all')
                    );
                }

                socket.emit('chat-history', messages);
            } catch (error) {
                console.error('❌ History error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Get all admin chats
        socket.on('get-all-chats', async (data) => {
            try {
                const { adminId } = data;
                const chatHistory = readData('admin-chat');
                const admins = getAllUsers().filter(u => u.isAdmin);
                
                const chats = admins.map(admin => {
                    const messages = chatHistory.filter(m => 
                        (m.fromAdminId === adminId && m.toAdminId === admin.id) ||
                        (m.fromAdminId === admin.id && m.toAdminId === adminId) ||
                        (m.toAdminId === 'all')
                    );
                    const lastMessage = messages[messages.length - 1];
                    const unreadCount = messages.filter(m => 
                        m.toAdminId === adminId && !m.read
                    ).length;
                    
                    return {
                        admin: {
                            id: admin.id,
                            name: admin.name,
                            role: admin.role,
                            isOnline: false
                        },
                        lastMessage: lastMessage || null,
                        unreadCount,
                        messages
                    };
                });

                socket.emit('all-chats', chats);
            } catch (error) {
                console.error('❌ Get all chats error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log('🔌 Admin disconnected from admin chat:', socket.id);
        });
    });
};