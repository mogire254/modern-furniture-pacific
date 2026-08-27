const { readData, writeData, addItem, findUserById, getAllUsers } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

module.exports = (io) => {
    const adminNamespace = io.of('/admin-chat');

    adminNamespace.on('connection', (socket) => {
        console.log('🔗 Admin connected to admin chat:', socket.id);

        // Join admin room
        socket.on('join-admin', (adminId) => {
            socket.join(`admin_${adminId}`);
            socket.join('admin_room');
            console.log(`👤 Admin ${adminId} joined admin chat`);
            
            adminNamespace.emit('admin-online', { adminId, status: 'online' });
            
            // Send chat history to the admin
            sendChatHistory(socket, adminId);
        });

        // ===== SIMPLIFIED: Send message to group =====
        socket.on('send-message', async (data) => {
            try {
                const { fromAdminId, message, mentions = [] } = data;

                if (!message || !message.trim()) {
                    socket.emit('error', { message: 'Message cannot be empty' });
                    return;
                }

                // Extract @mentions from message
                const mentionRegex = /@(\w+)/g;
                const foundMentions = [];
                let match;
                while ((match = mentionRegex.exec(message)) !== null) {
                    foundMentions.push(match[1]);
                }
                const allMentions = [...new Set([...mentions, ...foundMentions])];

                // Get sender info
                const sender = findUserById(fromAdminId);
                if (!sender) {
                    socket.emit('error', { message: 'Sender not found' });
                    return;
                }

                const chatMessage = {
                    id: uuidv4(),
                    fromAdminId,
                    fromAdminName: sender.name || 'Admin',
                    fromAdminRole: sender.role || 'admin',
                    message: message.trim(),
                    mentions: allMentions,
                    status: 'sent',
                    read: false,
                    createdAt: new Date().toISOString()
                };

                // Save to database
                const chatHistory = readData('admin-chat');
                chatHistory.push(chatMessage);
                writeData('admin-chat', chatHistory);

                // Broadcast to ALL admins in the group
                adminNamespace.to('admin_room').emit('receive-message', chatMessage);

                // Send back to sender
                socket.emit('message-sent', chatMessage);

                // Process @mentions - notify mentioned admins
                allMentions.forEach(mention => {
                    const admins = getAllUsers().filter(u => u.isAdmin);
                    const mentionedAdmin = admins.find(a => 
                        a.name.toLowerCase().includes(mention.toLowerCase()) ||
                        a.email.toLowerCase().includes(mention.toLowerCase())
                    );
                    
                    if (mentionedAdmin && mentionedAdmin.id !== fromAdminId) {
                        adminNamespace.to(`admin_${mentionedAdmin.id}`).emit('mentioned', {
                            from: sender.name,
                            fromId: fromAdminId,
                            message: `You were mentioned by ${sender.name}: ${message}`,
                            chatMessage: chatMessage
                        });
                        console.log(`📢 Admin ${fromAdminId} mentioned @${mention}`);
                    }
                });

                console.log(`💬 Admin ${sender.name} sent message to group`);

            } catch (error) {
                console.error('❌ Admin chat error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // ===== Edit message =====
        socket.on('edit-message', async (data) => {
            try {
                const { messageId, newMessage, adminId } = data;
                const chatHistory = readData('admin-chat');
                const messageIndex = chatHistory.findIndex(m => m.id === messageId);
                
                if (messageIndex !== -1) {
                    // Check if user owns this message
                    if (chatHistory[messageIndex].fromAdminId !== adminId) {
                        socket.emit('error', { message: 'You can only edit your own messages' });
                        return;
                    }
                    
                    chatHistory[messageIndex].message = newMessage;
                    chatHistory[messageIndex].edited = true;
                    chatHistory[messageIndex].editedAt = new Date().toISOString();
                    chatHistory[messageIndex].editedBy = adminId;
                    writeData('admin-chat', chatHistory);
                    
                    // Broadcast edited message to all admins
                    adminNamespace.to('admin_room').emit('message-edited', chatHistory[messageIndex]);
                }
            } catch (error) {
                console.error('❌ Edit message error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // ===== Get chat history =====
        function sendChatHistory(socket, adminId) {
            try {
                const chatHistory = readData('admin-chat');
                // Send all messages (group chat)
                socket.emit('chat-history', chatHistory);
            } catch (error) {
                console.error('❌ History error:', error);
                socket.emit('error', { message: error.message });
            }
        }

        // ===== Mark as read =====
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

        // ===== Get all chats =====
        socket.on('get-all-chats', async () => {
            try {
                const chatHistory = readData('admin-chat');
                socket.emit('all-chats', chatHistory);
            } catch (error) {
                console.error('❌ Get all chats error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // ===== Disconnect =====
        socket.on('disconnect', () => {
            console.log('🔌 Admin disconnected from admin chat:', socket.id);
        });
    });
};