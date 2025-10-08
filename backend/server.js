const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Check for essential environment variables
if (!process.env.MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined.');
    console.error('Please create a .env file in the /backend directory and add your MongoDB Atlas connection string.');
    process.exit(1); // Exit the process with a failure code
}

// Ensure JWT secret is defined for signing tokens
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    console.error('Set JWT_SECRET in backend/.env to a strong random string (do NOT commit this value).');
    process.exit(1);
}

const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for simplicity
    },
});

// Middleware
app.use(compression()); // Enable gzip/brotli compression for all responses
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit to handle base64 images

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Global error handling middleware for Mongoose validation errors
app.use((err, req, res, next) => {
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors
        });
    }
    
    // Mongoose cast error (invalid ObjectId, etc.)
    if (err.name === 'CastError') {
        return res.status(400).json({
            message: `Invalid ${err.path}: ${err.value}`,
            error: err.message
        });
    }
    
    // MongoDB duplicate key error
    if (err.name === 'MongoServerError' && err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({
            message: `A record with this ${field} already exists`,
            error: 'Duplicate key error'
        });
    }
    
    // Default error
    console.error('Unhandled error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});


// Socket.IO Connection
let users = [];

const addUser = (userId, socketId) => {
    !users.some((user) => user.userId === userId) &&
        users.push({ userId, socketId });
};

const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
    return users.find((user) => user.userId === userId);
};

io.on('connection', (socket) => {
    // When a user connects
    console.log('A user connected.');
    socket.on('addUser', (userId) => {
        addUser(userId, socket.id);
        io.emit('getUsers', users);
    });

    // Send and get message with acknowledgment
    socket.on('sendMessage', async ({ senderId, receiverId, text, conversationId, image }, callback) => {
        try {
            const newMessage = new Message({
                senderId,
                conversationId,
                text,
                image,
                status: 'delivered'
            });
            const savedMessage = await newMessage.save();

            await Conversation.findByIdAndUpdate(conversationId, {
                lastMessage: savedMessage._id
            });

            const receiver = getUser(receiverId);
            if (receiver) {
                io.to(receiver.socketId).emit('receiveMessage', {
                     ...savedMessage.toObject(),
                     id: savedMessage._id, // ensure id is present
                });
            }
            
            // Send acknowledgment to sender
            if (callback && typeof callback === 'function') {
                callback({ success: true, message: savedMessage });
            }
        } catch (error) {
            console.error('Error saving message:', error);
            // Send error acknowledgment
            if (callback && typeof callback === 'function') {
                callback({ 
                    success: false, 
                    error: error.message || 'Failed to send message' 
                });
            }
        }
    });
    
    // Typing indicator
    socket.on('typingStart', ({ conversationId, receiverId }) => {
        const receiver = getUser(receiverId);
        if (receiver) {
            io.to(receiver.socketId).emit('typingStart', { conversationId });
        }
    });

    socket.on('typingStop', ({ conversationId, receiverId }) => {
        const receiver = getUser(receiverId);
        if (receiver) {
            io.to(receiver.socketId).emit('typingStop', { conversationId });
        }
    });
    
    // Admin: Edit message (real-time)
    socket.on('adminEditMessage', async ({ messageId, newText, adminId, conversationId }) => {
        try {
            const message = await Message.findById(messageId);
            if (message) {
                const originalText = message.text;
                message.text = newText;
                message.isEdited = true;
                message.lastEditedBy = adminId;
                message.lastEditedAt = new Date();
                
                if (!message.editHistory) message.editHistory = [];
                message.editHistory.push({
                    editedBy: adminId,
                    editedAt: new Date(),
                    originalText: originalText,
                    editType: 'admin',
                });
                
                await message.save();
                
                // Notify all users in the conversation
                io.emit('messageEdited', {
                    messageId,
                    newText,
                    conversationId,
                    editedBy: adminId,
                    isAdminEdit: true,
                });
                
                console.log(`[SOCKET] Admin ${adminId} edited message ${messageId}`);
            }
        } catch (err) {
            console.error('Socket admin edit error:', err);
        }
    });
    
    // Admin: Delete message (real-time)
    socket.on('adminDeleteMessage', async ({ messageId, adminId, conversationId }) => {
        try {
            const message = await Message.findByIdAndDelete(messageId);
            if (message) {
                // Notify all users in the conversation
                io.emit('messageDeleted', {
                    messageId,
                    conversationId,
                    deletedBy: adminId,
                    isAdminDelete: true,
                });
                
                console.log(`[SOCKET] Admin ${adminId} deleted message ${messageId}`);
            }
        } catch (err) {
            console.error('Socket admin delete error:', err);
        }
    });
    
    // Admin: Flag message (real-time)
    socket.on('adminFlagMessage', async ({ messageId, adminId, reason, conversationId }) => {
        try {
            const message = await Message.findById(messageId);
            if (message) {
                message.isFlagged = true;
                message.flaggedBy = adminId;
                message.flaggedAt = new Date();
                message.flagReason = reason || 'No reason provided';
                message.flagStatus = 'pending';
                
                await message.save();
                
                // Notify admins (you can filter by admin role)
                io.emit('messageFlagged', {
                    messageId,
                    conversationId,
                    flaggedBy: adminId,
                    reason,
                });
                
                console.log(`[SOCKET] Admin ${adminId} flagged message ${messageId}`);
            }
        } catch (err) {
            console.error('Socket admin flag error:', err);
        }
    });
    
    // Read receipts
    socket.on('markAsRead', async ({ conversationId, receiverId }) => {
         await Message.updateMany(
            { conversationId: conversationId, senderId: receiverId, status: { $ne: 'read' } },
            { $set: { status: 'read' } }
        );
         const sender = getUser(receiverId);
         if (sender) {
             io.to(sender.socketId).emit('messagesRead', { conversationId });
         }
    });

    // When a user disconnects
    socket.on('disconnect', () => {
        console.log('A user disconnected.');
        removeUser(socket.id);
        io.emit('getUsers', users);
    });
});


// MongoDB Connection with proper error handling
const PORT = process.env.PORT || 8900;

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    maxPoolSize: 10, // Connection pool size
})
    .then(() => {
        console.log('Connected to MongoDB Atlas');
        server.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
        console.error('Error reason:', err.reason);
        process.exit(1);
    });

// Handle errors after initial connection
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error after initial connection:', err);
});

// Handle disconnection
mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
});

// Handle reconnection
mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully');
});

// Handle connection timeout
mongoose.connection.on('timeout', () => {
    console.error('MongoDB connection timeout');
});