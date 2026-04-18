const cron = require('node-cron');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { logger } = require('../utils/system.utils');

// Models
const User = require('../models/user.model');
const Connection = require('../models/connection.model');
const Audit = require('../models/audit.model');
const Project = require('../models/project.model');
const Task = require('../models/task.model');

// Services
const { captureProjectSnapshots } = require('../services/analytics.service');

// ─── 1. Garbage Collection (DB Hygiene) ───────────────────────────────────
const performGarbageCollection = async () => {
    logger.info('🗑️ Starting Database Garbage Collection...');
    try {
        await captureProjectSnapshots(); // Forensic state capture
        
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Purge Unverified Users
        const userResult = await User.deleteMany({
            isEmailVerified: false,
            role: { $ne: 'Admin' },
            createdAt: { $lt: twentyFourHoursAgo }
        });

        // Purge Stale Audit Logs (24h retention)
        const auditResult = await Audit.deleteMany({
            createdAt: { $lt: twentyFourHoursAgo }
        });

        // Purge Soft-Deleted Projects (> 7 days)
        const staleProjects = await Project.find({
            $or: [
                { deletedAt: { $lt: sevenDaysAgo, $ne: null } },
                { status: 'Archived', updatedAt: { $lt: sevenDaysAgo } }
            ]
        }).select('_id');

        if (staleProjects.length > 0) {
            const projectIds = staleProjects.map(p => p._id);
            await Task.deleteMany({ project: { $in: projectIds } });
            await Project.deleteMany({ _id: { $in: projectIds } });
        }

        logger.info(`✅ GC Complete: Purged ${userResult.deletedCount} users, ${auditResult.deletedCount} audit logs, and ${staleProjects.length} stale projects.`);
    } catch (error) {
        logger.error(`❌ GC Failed: ${error.message}`);
    }
};

// ─── 2. Social Integrity Cleanup ──────────────────────────────────────────
const performSocialCleanup = async () => {
    logger.info('🧹 Starting Social Integrity Cleanup...');
    try {
        // Fix Connection Counts
        const users = await User.find({}).select('_id name totalConnections');
        for (const user of users) {
            const realCount = await Connection.countDocuments({
                $or: [{ requester: user._id }, { recipient: user._id }],
                status: 'accepted'
            });
            if (user.totalConnections !== realCount) {
                user.totalConnections = realCount;
                await user.save();
            }
        }

        // Auto-expire old pending requests (7+ days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const expired = await Connection.deleteMany({
            status: 'pending',
            createdAt: { $lt: sevenDaysAgo }
        });

        logger.info(`✅ Social Cleanup Complete: Expired ${expired.deletedCount} requests.`);
    } catch (err) {
        logger.error(`❌ Social Cleanup Failed: ${err.message}`);
    }
};

// ─── 3. Filesystem Redundancy Cleanup ──────────────────────────────────────
const performFilesystemCleanup = async () => {
    logger.info('🧹 Starting Filesystem Redundancy Cleanup...');
    const cleanupTargets = [
        path.join(__dirname, '../public/temp'),
        path.join(__dirname, '../uploads/temp'),
        path.join(__dirname, '../tmp')
    ];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const targetDir of cleanupTargets) {
        if (existsSync(targetDir)) {
            try {
                const files = await fs.readdir(targetDir);
                for (const file of files) {
                    const filePath = path.join(targetDir, file);
                    const stats = await fs.stat(filePath);
                    if (stats.mtimeMs < sevenDaysAgo) {
                        if (stats.isDirectory()) await fs.rm(filePath, { recursive: true, force: true });
                        else await fs.unlink(filePath);
                    }
                }
            } catch (err) {
                logger.error(`❌ FS Cleanup failed for ${targetDir}: ${err.message}`);
            }
        }
    }
    logger.info('✅ Filesystem Cleanup Complete.');
};

// ─── Scheduler ─────────────────────────────────────────────────────────────
const startMaintenanceHub = () => {
    // GC & Social Integrity (Daily 03:00 AM)
    cron.schedule('0 3 * * *', () => {
        performGarbageCollection();
        performSocialCleanup();
    });

    // FS Cleanup (Weekly Sunday 04:00 AM)
    cron.schedule('0 4 * * 0', performFilesystemCleanup);

    logger.info('🕒 Maintenance Hub Initialized (Janitorial tasks scheduled)');
};

module.exports = startMaintenanceHub;
