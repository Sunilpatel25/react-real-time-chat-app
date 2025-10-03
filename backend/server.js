const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
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
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit to handle base64 images

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);


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

    // Send and get message
    socket.on('sendMessage', async ({ senderId, receiverId, text, conversationId, image }) => {
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
        } catch (error) {
            console.error('Error saving message:', error);
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


// MongoDB Connection
const PORT = process.env.PORT || 8900;
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB Atlas');
        server.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });