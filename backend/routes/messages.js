const router = require('express').Router();
const Message = require('../models/Message');

// Add a message (This is now primarily handled by sockets, but an HTTP endpoint is good practice)
router.post('/', async (req, res) => {
    const newMessage = new Message(req.body);
    try {
        const savedMessage = await newMessage.save();
        res.status(200).json(savedMessage);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get messages for a conversation
router.get('/:conversationId', async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId,
        }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Mark messages as read
router.post('/read', async (req, res) => {
    try {
        const { conversationId } = req.body;
        // In a real app, you would verify the user has access to this conversation
        await Message.updateMany(
            { conversationId, status: { $ne: 'read' } }, // Add logic to ensure only receiver's messages are marked
            { $set: { status: 'read' } }
        );
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;
