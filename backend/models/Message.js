const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {
        type: String,
    },
    image: {
        type: String,
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent',
    },
    // Admin edit tracking
    isEdited: {
        type: Boolean,
        default: false,
    },
    lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    lastEditedAt: {
        type: Date,
    },
    editHistory: [{
        editedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        editedAt: {
            type: Date,
            default: Date.now,
        },
        originalText: String,
        editType: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
    }],
    // Admin flag tracking
    isFlagged: {
        type: Boolean,
        default: false,
    },
    flaggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    flaggedAt: {
        type: Date,
    },
    flagReason: {
        type: String,
    },
    flagStatus: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending',
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    resolvedAt: {
        type: Date,
    },
    resolution: {
        type: String,
    },
}, {
    timestamps: true
});

MessageSchema.pre('save', function(next) {
  if (!this.text && !this.image) {
    next(new Error('Message must have either text or an image.'));
  } else {
    next();
  }
});

// Rename timestamp field and format output
MessageSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        returnedObject.timestamp = returnedObject.createdAt;
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.createdAt;
        delete returnedObject.updatedAt;
    }
});


module.exports = mongoose.model('Message', MessageSchema);