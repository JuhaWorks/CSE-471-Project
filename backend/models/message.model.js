const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat',
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            trim: true,
            default: ''
        },
        type: {
            type: String,
            enum: ['text', 'image', 'video', 'file', 'artifact', 'system'],
            default: 'text'
        },
        metadata: {
            artifactType: String,
            artifactId: mongoose.Schema.Types.ObjectId,
            artifactName: String
        },
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: null
        },
        deleted: {
            type: Boolean,
            default: false
        },
        isReadBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ]
    },
    {
        timestamps: true,
    }
);

// Fast history lookup
messageSchema.index({ chat: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
