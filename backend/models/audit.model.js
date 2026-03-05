const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema(
    {
        entityType: {
            type: String,
            required: true,
            enum: ['Task', 'Project', 'User', 'Settings'],
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: ['Create', 'Update', 'Delete', 'Deactivate', 'StatusChange'],
        },
        details: {
            type: String,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            description: 'The user who performed the action'
        }
    },
    {
        timestamps: true, // Auto adds createdAt timestamp
    }
);

// Explicit indexing for fast fetching of logs by Entity or by User
auditSchema.index({ entityId: 1, createdAt: -1 });
auditSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Audit', auditSchema);
