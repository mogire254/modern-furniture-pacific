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

        // Send message
        socket.on('send-message', async (data) => {
            try {
                const { fromAdminId, toAdminId, message, type = 'text', tag = null } = data;

                const chatMessage = {
                    id: uuidv4(),
                    fromAdminId,
                    toAdminId,
                    message,
                    type,
                    tag: tag || null,
                    status: 'sent',
                    read: false,
                    createdAt: new Date().toISOString()
                };

                // Save to database
                const chatHistory = readData('admin-chat');
                chatHistory.push(chatMessage);
                writeData('admin-chat', chatHistory);

                // Send to recipient
                adminNamespace.to(`admin_${toAdminId}`).emit('receive-message', chatMessage);

                // Send back to sender
                socket.emit('message-sent', chatMessage);

                // If tagged
                if (tag) {
                    console.log(`📢 Admin ${fromAdminId} tagged @${tag}`);
                    // Send notification
                    adminNamespace.to(`admin_${toAdminId}`).emit('tagged', {
                        from: fromAdminId,
                        message: `You were tagged in a message: ${message.substring(0, 50)}...`
                    });
                }

                console.log(`💬 Admin message from ${fromAdminId} to ${toAdminId}`);
            } catch (error) {
                console.error('❌ Admin chat error:', error);
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
                
                const messages = chatHistory.filter(m => 
                    (m.fromAdminId === adminId && m.toAdminId === otherAdminId) ||
                    (m.fromAdminId === otherAdminId && m.toAdminId === adminId)
                );

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
                        (m.fromAdminId === admin.id && m.toAdminId === adminId)
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
                            isOnline: false // Track online status
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