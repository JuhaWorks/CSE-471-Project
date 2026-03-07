const mongoose = require('mongoose');

const projectActivitySchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            required: true,
            // Example actions: 'PROJECT_CREATED', 'UPDATED_DATES', 'ADDED_MEMBER', 'SOFT_DELETED'
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed, // JSON details of the change
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Fast fetching of project-specific activity sorted by time
projectActivitySchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('ProjectActivity', projectActivitySchema);
