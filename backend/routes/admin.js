const router = require('express').Router();
const Message = require('../models/Message');
const User = require('../models/User');

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
    try {
        const userId = req.body.adminId || req.query.adminId || req.headers['x-admin-id'];
        
        if (!userId) {
            return res.status(401).json({ 
                error: 'Unauthorized', 
                message: 'Admin ID is required' 
            });
        }

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ 
                error: 'Not Found', 
                message: 'User not found' 
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ 
                error: 'Forbidden', 
                message: 'Admin privileges required' 
            });
        }

        req.admin = user;
        next();
    } catch (err) {
        res.status(500).json({ 
            error: 'Server Error', 
            message: err.message 
        });
    }
};

// Admin: Edit any message
router.put('/messages/:messageId', verifyAdmin, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text, adminId } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ 
                error: 'Bad Request', 
                message: 'Message text is required' 
            });
        }

        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ 
                error: 'Not Found', 
                message: 'Message not found' 
            });
        }

        // Store original content for audit
        const originalText = message.text;
        const editHistory = message.editHistory || [];
        
        editHistory.push({
            editedBy: adminId,
            editedAt: new Date(),
            originalText: originalText,
            editType: 'admin',
        });

        // Update message
        message.text = text.trim();
        message.editHistory = editHistory;
        message.isEdited = true;
        message.lastEditedBy = adminId;
        message.lastEditedAt = new Date();

        const updatedMessage = await message.save();

        // Log admin action
        console.log(`[ADMIN ACTION] User ${req.admin.name} (${adminId}) edited message ${messageId}`);
        console.log(`Original: "${originalText}" → New: "${text}"`);

        res.status(200).json({
            success: true,
            message: updatedMessage,
            action: 'edit',
            performedBy: req.admin.name,
        });

    } catch (err) {
        console.error('Admin edit error:', err);
        res.status(500).json({ 
            error: 'Server Error', 
            message: err.message 
        });
    }
});

// Admin: Delete any message
router.delete('/messages/:messageId', verifyAdmin, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { adminId } = req.body;

        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ 
                error: 'Not Found', 
                message: 'Message not found' 
            });
        }

        // Store deletion record before deleting
        const deletionRecord = {
            messageId: message._id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            text: message.text,
            image: message.image,
            deletedBy: adminId,
            deletedAt: new Date(),
            originalTimestamp: message.createdAt,
        };

        // Log admin action before deletion
        console.log(`[ADMIN ACTION] User ${req.admin.name} (${adminId}) deleted message ${messageId}`);
        console.log(`Deleted message:`, deletionRecord);

        // Delete the message
        await Message.findByIdAndDelete(messageId);

        res.status(200).json({
            success: true,
            messageId: messageId,
            action: 'delete',
            performedBy: req.admin.name,
            deletionRecord: deletionRecord,
        });

    } catch (err) {
        console.error('Admin delete error:', err);
        res.status(500).json({ 
            error: 'Server Error', 
            message: err.message 
        });
    }
});

// Admin: Bulk delete messages
router.post('/messages/bulk-delete', verifyAdmin, async (req, res) => {
    try {
        const { messageIds, adminId } = req.body;

        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ 
                error: 'Bad Request', 
                message: 'messageIds array is required and must not be empty' 
            });
        }

        // Fetch messages before deletion for logging
        const messages = await Message.find({ _id: { $in: messageIds } });
        
        const deletionRecords = messages.map(msg => ({
            messageId: msg._id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            text: msg.text,
            deletedBy: adminId,
            deletedAt: new Date(),
        }));

        // Delete all messages
        const result = await Message.deleteMany({ _id: { $in: messageIds } });

        // Log admin action
        console.log(`[ADMIN ACTION] User ${req.admin.name} (${adminId}) bulk deleted ${result.deletedCount} messages`);

        res.status(200).json({
            success: true,
            deletedCount: result.deletedCount,
            action: 'bulk_delete',
            performedBy: req.admin.name,
            deletionRecords: deletionRecords,
        });

    } catch (err) {
        console.error('Admin bulk delete error:', err);
        res.status(500).json({ 
            error: 'Server Error', 
            message: err.message 
        });
    }
});

// Admin: Flag message for review
router.post('/messages/:messageId/flag', verifyAdmin, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { adminId, reason } = req.body;

        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ 
                error: 'Not Found', 
                message: 'Message not found' 
            });
        }

        // Add flag to message
        message.isFlagged = true;
        message.flaggedBy = adminId;
        message.flaggedAt = new Date();
        message.flagReason = reason || 'No reason provided';
        message.flagStatus = 'pending'; // pending, reviewed, resolved

        const updatedMessage = await message.save();

        // Log admin action
        console.log(`[ADMIN ACTION] User ${req.admin.name} (${adminId}) flagged message ${messageId}`);
        console.log(`Reason: ${reason || 'No reason provided'}`);

        res.status(200).json({
            success: true,
            message: updatedMessage,
            action: 'flag',
            performedBy: req.admin.name,
            flagReason: reason,
        });

    } catch (err) {
        console.error('Admin flag error:', err);
        res.status(500).json({ 
            error: 'Server Error', 
            message: err.message 
        });
    }
});

// Admin: Unflag message
router.post('/messages/:messageId/unflag', verifyAdmin, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { adminId, resolution } = req.body;

        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ 
                error: 'Not Found', 
                message: 'Message not found' 
            });
        }

        // Update flag status
        message.isFlagged = false;
        message.flagStatus = 'resolved';
        message.resolvedBy = adminId;
        message.resolvedAt = new Date();
        message.resolution = resolution || 'No resolution notes';

        const updatedMessage = await message.save();

        // Log admin action
        console.log(`[ADMIN ACTION] User ${req.admin.name} (${adminId}) unflagged message ${messageId}`);

        res.status(200).json({
            success: true,
            message: updatedMessage,
            action: 'unflag',
            performedBy: req.admin.name,
        });

    } catch (err) {
        console.error('Admin unflag error:', err);
        res.status(500).json({ 
            error: 'Server Error', 
            message: err.message 
        });
    }
});

// Admin: Get message details with full metadata
router.get('/messages/:messageId/details', verifyAdmin, async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId)
            .populate('senderId', 'name email avatar role')
            .populate('conversationId');
        
        if (!message) {
            return res.status(404).json({ 
                error: 'Not Found', 
                message: 'Message not found' 
            });
        }

        // Log admin action
        console.log(`[ADMIN ACTION] User ${req.admin.name} viewed details for message ${messageId}`);

        res.status(200).json({
            success: true,
            message: message,
            action: 'view_details',
            performedBy: req.admin.name,
        });

    } catch (err) {
        console.error('Admin view details error:', err);
        res.status(500).json({ 
            error: 'Server Error', 
            message: err.message 
        });
    }
});

// Admin: Get all flagged messages
router.get('/messages/flagged', verifyAdmin, async (req, res) => {
    try {
        const { status } = req.query; // pending, reviewed, resolved
        
        const query = { isFlagged: true };
        if (status) {
            query.flagStatus = status;
        }

        const flaggedMessages = await Message.find(query)
            .populate('senderId', 'name email avatar')
            .populate('flaggedBy', 'name email')
            .sort({ flaggedAt: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            count: flaggedMessages.length,
            messages: flaggedMessages,
        });

    } catch (err) {
        console.error('Admin get flagged messages error:', err);
        res.status(500).json({ 
            error: 'Server Error', 
            message: err.message 
        });
    }
});

// Admin: Get admin activity log
router.get('/activity-log', verifyAdmin, async (req, res) => {
    try {
        const { limit = 50, skip = 0 } = req.query;

        // Get edited messages
        const editedMessages = await Message.find({ isEdited: true, lastEditedBy: { $exists: true } })
            .populate('lastEditedBy', 'name email')
            .populate('senderId', 'name email')
            .sort({ lastEditedAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        // Get flagged messages
        const flaggedMessages = await Message.find({ isFlagged: true })
            .populate('flaggedBy', 'name email')
            .populate('senderId', 'name email')
            .sort({ flaggedAt: -1 })
            .limit(parseInt(limit));

        const activityLog = {
            edits: editedMessages.map(msg => ({
                action: 'edit',
                messageId: msg._id,
                performedBy: msg.lastEditedBy,
                performedAt: msg.lastEditedAt,
                originalSender: msg.senderId,
                editHistory: msg.editHistory,
            })),
            flags: flaggedMessages.map(msg => ({
                action: 'flag',
                messageId: msg._id,
                performedBy: msg.flaggedBy,
                performedAt: msg.flaggedAt,
                reason: msg.flagReason,
                status: msg.flagStatus,
                originalSender: msg.senderId,
            })),
        };

        res.status(200).json({
            success: true,
            activityLog: activityLog,
        });

    } catch (err) {
        console.error('Admin activity log error:', err);
        res.status(500).json({ 
            error: 'Server Error', 
            message: err.message 
        });
    }
});

// Admin: Get statistics
router.get('/stats', verifyAdmin, async (req, res) => {
    try {
        const totalMessages = await Message.countDocuments();
        const editedMessages = await Message.countDocuments({ isEdited: true });
        const flaggedMessages = await Message.countDocuments({ isFlagged: true });
        const pendingFlags = await Message.countDocuments({ isFlagged: true, flagStatus: 'pending' });

        res.status(200).json({
            success: true,
            stats: {
                totalMessages,
                editedMessages,
                flaggedMessages,
                pendingFlags,
                editPercentage: totalMessages > 0 ? ((editedMessages / totalMessages) * 100).toFixed(2) : 0,
                flagPercentage: totalMessages > 0 ? ((flaggedMessages / totalMessages) * 100).toFixed(2) : 0,
            },
        });

    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ 
            error: 'Server Error', 
            message: err.message 
        });
    }
});

module.exports = router;
