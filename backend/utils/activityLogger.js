const ProjectActivity = require('../models/projectActivity.model');
const Audit = require('../models/audit.model');
const logger = require('./logger');

/**
 * Global Activity Logger Helper
 * Logs to both the dedicated ProjectActivity collection and the general Audit collection
 */
const logActivity = async (projectId, actorId, action, metadata = {}) => {
    try {
        // 1. Log to Project-Specific Activity (for Timeline view)
        await ProjectActivity.create({
            projectId,
            actorId,
            action,
            metadata
        });

        // 2. Log to Global Audit Trail (for Admin/Security tracking)
        await Audit.create({
            user: actorId,
            action,
            entityType: 'Project',
            entityId: projectId,
            details: metadata || {},
            ipAddress: 'System'
        });

        logger.info(`Activity Logged: ${action} on Project ${projectId}`);
    } catch (error) {
        logger.error(`Failed to log activity: ${error.message}`);
    }
};

module.exports = { logActivity };
