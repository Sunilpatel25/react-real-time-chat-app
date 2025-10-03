const router = require('express').Router();
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// New conversation
router.post('/', async (req, res) => {
    const newConversation = new Conversation({
        members: [req.body.senderId, req.body.receiverId],
    });
    try {
        const savedConversation = await newConversation.save();
        res.status(200).json(savedConversation);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Get conversations of a user
router.get('/:userId', async (req, res) => {
    try {
        const conversations = await Conversation.find({
            members: { $in: [req.params.userId] },
        })
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

        const detailedConversations = await Promise.all(
            conversations.map(async (conv) => {
                const otherUserId = conv.members.find(id => id.toString() !== req.params.userId);
                const otherUser = await User.findById(otherUserId);
                return {
                    ...conv.toJSON(),
                    otherUser: otherUser ? otherUser.toJSON() : null,
                };
            })
        );

        res.status(200).json(detailedConversations);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Find or create a conversation between two users
router.post('/find', async (req, res) => {
    try {
        const { userId1, userId2 } = req.body;
        let conversation = await Conversation.findOne({
            members: { $all: [userId1, userId2] },
        });

        if (conversation) {
            return res.status(200).json(conversation);
        }

        const newConversation = new Conversation({
            members: [userId1, userId2],
        });
        const savedConversation = await newConversation.save();
        res.status(200).json(savedConversation);

    } catch(err) {
        res.status(500).json(err);
    }
});


module.exports = router;
