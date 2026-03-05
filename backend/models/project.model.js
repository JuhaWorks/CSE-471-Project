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
        // Track team members and their specific roles on the project
        teamMembers: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                role: {
                    type: String,
                    enum: ['manager', 'developer', 'designer', 'viewer'],
                    default: 'developer',
                },
            }
        ],
    },
    {
        timestamps: true,
    }
);

// Optimize lookups for determining which projects a user belongs to
projectSchema.index({ 'teamMembers.user': 1 });

// Add $text index for Global Search weighting
projectSchema.index(
    { name: 'text', description: 'text' },
    { name: "ProjectTextIndex", weights: { name: 10, description: 5 } }
);

module.exports = mongoose.model('Project', projectSchema);
