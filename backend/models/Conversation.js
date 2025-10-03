const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    members: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        validate: [arrayLimit, '{PATH} exceeds the limit of 2']
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null,
    }
}, {
    timestamps: true
});

function arrayLimit(val) {
    return val.length <= 2;
}

// Use a transform to change _id to id
ConversationSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

module.exports = mongoose.model('Conversation', ConversationSchema);
