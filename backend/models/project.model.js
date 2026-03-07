const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a project name'],
            trim: true,
            maxlength: [100, 'Name can not be more than 100 characters'],
        },
        description: {
            type: String,
            required: [true, 'Please add a description'],
            maxlength: [500, 'Description can not be more than 500 characters'],
        },
        category: {
            type: String,
            required: [true, 'Please add a category'],
            trim: true,
        },
        startDate: {
            type: Date,
            required: [true, 'Please add a start date'],
        },
        endDate: {
            type: Date,
            required: [true, 'Please add an end date'],
        },
        status: {
            type: String,
            enum: ['Draft', 'Active', 'Paused', 'Completed', 'Archived'],
            default: 'Active',
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        // Workspace Members Array
        members: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                role: {
                    type: String,
                    enum: ['Manager', 'Editor', 'Viewer'],
                    default: 'Editor',
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            }
        ],
    },
    {
        timestamps: true,
    }
);

// Optimize lookups for determining which projects a user belongs to
projectSchema.index({ 'members.userId': 1 });

// Index for soft-delete filtering
projectSchema.index({ deletedAt: 1 });

// Add $text index for Global Search weighting
projectSchema.index(
    { name: 'text', description: 'text' },
    { name: "ProjectTextIndex", weights: { name: 10, description: 5 } }
);

module.exports = mongoose.model('Project', projectSchema);

