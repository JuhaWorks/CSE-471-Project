const Project = require('../models/project.model');

/**
 * Archival Freeze Middleware
 * Blocks all PUT, POST, DELETE requests to archived projects
 */
const isNotArchived = async (req, res, next) => {
    try {
        const projectId = req.params.id || req.params.projectId;
        if (!projectId) return next();

        const project = await Project.findById(projectId);

        if (project && project.status === 'Archived') {
            res.status(403);
            throw new Error('Archived projects are strictly read-only.');
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * RBAC Helper Middleware
 * Ensures only Managers/Editors can perform mutations
 */
const authorizeProjectAccess = (roles = []) => {
    return async (req, res, next) => {
        try {
            const projectId = req.params.id || req.params.projectId;
            const project = await Project.findById(projectId);

            if (!project) {
                res.status(404);
                throw new Error('Project not found');
            }

            const member = project.members.find(m => m.userId.toString() === req.user._id.toString());
            const hasAccess = (member && (roles.length === 0 || roles.includes(member.role))) || req.user.role === 'Admin';

            if (!hasAccess) {
                res.status(403);
                throw new Error('You do not have the required permissions for this action.');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = { isNotArchived, authorizeProjectAccess };
