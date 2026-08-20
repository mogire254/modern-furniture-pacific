const { readData, writeData, addItem, findUserById } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

module.exports = (io) => {
    const chatNamespace = io.of('/chat');

    chatNamespace.on('connection', (socket) => {
        console.log('🔗 User connected to chat:', socket.id);

        // Join user to their own room
        socket.on('join', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`👤 User ${userId} joined chat`);
        });

        // Send message
        socket.on('send-message', async (data) => {
            try {
                const { fromUserId, toUserId, message, type = 'text' } = data;

                const chatMessage = {
                    id: uuidv4(),
                    fromUserId,
                    toUserId,
                    message,
                    type,
                    status: 'sent',
                    read: false,
                    createdAt: new Date().toISOString()
                };

                // Save to database
                const chatHistory = readData('customer-care');
                chatHistory.push(chatMessage);
                writeData('customer-care', chatHistory);

                // Send to recipient
                chatNamespace.to(`user_${toUserId}`).emit('receive-message', chatMessage);

                // Send back to sender
                socket.emit('message-sent', chatMessage);

                // If offline notification needed
                const recipient = findUserById(toUserId);
                if (recipient) {
                    console.log(`📧 Sending offline notification to ${recipient.email}`);
                }

                console.log(`💬 Message from ${fromUserId} to ${toUserId}`);
            } catch (error) {
                console.error('❌ Chat error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Mark as read
        socket.on('mark-read', async (data) => {
            try {
                const { messageId, userId } = data;
                const chatHistory = readData('customer-care');
                const messageIndex = chatHistory.findIndex(m => m.id === messageId);
                
                if (messageIndex !== -1) {
                    chatHistory[messageIndex].read = true;
                    chatHistory[messageIndex].readAt = new Date().toISOString();
                    writeData('customer-care', chatHistory);
                    
                    socket.emit('message-read', { messageId, userId });
                }
            } catch (error) {
                console.error('❌ Mark read error:', error);
            }
        });

        // Get chat history
        socket.on('get-history', async (data) => {
            try {
                const { userId, otherUserId } = data;
                const chatHistory = readData('customer-care');
                
                const messages = chatHistory.filter(m => 
                    (m.fromUserId === userId && m.toUserId === otherUserId) ||
                    (m.fromUserId === otherUserId && m.toUserId === userId)
                );

                socket.emit('chat-history', messages);
            } catch (error) {
                console.error('❌ History error:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log('🔌 User disconnected from chat:', socket.id);
        });
    });
};