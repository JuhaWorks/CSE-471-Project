const cron = require('node-cron');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const ProjectSnapshot = require('../models/projectSnapshot.model');
const { sendEmail } = require('../utils/service.utils');
const { logger } = require('../utils/system.utils');

// ─── 1. Intelligence Snapshots ──────────────────────────────────────────
const captureGlobalSnapshots = async () => {
    logger.info('🚀 Starting Daily Intelligence Snapshot process...');
    try {
        const activeProjects = await Project.find({ deletedAt: null }).select('_id name');
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (const project of activeProjects) {
            const tasks = await Task.find({ project: project._id, isArchived: false }).select('status updatedAt').lean();
            const completedToday = tasks.filter(t => t.status === 'Completed' && t.updatedAt >= now).length;
            const totalTasks = tasks.length;
            const activeTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Canceled').length;

            await ProjectSnapshot.findOneAndUpdate(
                { project: project._id, date: now },
                {
                    project: project._id,
                    date: now,
                    velocity: completedToday,
                    pointsCompleted: totalTasks - activeTasks,
                    mttrData: [{ label: 'Tasks Remaining', value: activeTasks }, { label: 'Total Tasks', value: totalTasks }]
                },
                { upsert: true }
            );
        }
        logger.info('✅ Snapshots recorded.');
    } catch (error) {
        logger.error(`❌ Snapshotter Error: ${error.message}`);
    }
};

// ─── 2. Daily Activity Digest ───────────────────────────────────────────
const sendDailyDigests = async () => {
    logger.info('⏰ Starting Daily Notification Digest dispatch...');
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const users = await User.find({ 'notificationPrefs.frequency': 'digest' }).select('email name');

        for (const user of users) {
            const pending = await Notification.find({
                recipient: user._id,
                isEmailed: false,
                createdAt: { $gte: twentyFourHoursAgo }
            }).sort('-createdAt').limit(50).lean();

            if (pending.length === 0) continue;

            const notificationListHtml = pending.map(n => `
                <div style="margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #6366f1;">
                    <h3 style="margin: 0; font-size: 16px;">${n.title}</h3>
                    <p style="margin: 5px 0 0 0; color: #4b5563;">${n.message}</p>
                </div>
            `).join('');

            await sendEmail({
                to: user.email,
                subject: `[Klivra] Daily Digest - ${pending.length} new items`,
                html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6366f1;">Daily Activity Summary</h2>
                    ${notificationListHtml}
                </div>`
            });

            await Notification.updateMany({ _id: { $in: pending.map(n => n._id) } }, { isEmailed: true });
        }
        logger.info('✅ Digests dispatched.');
    } catch (error) {
        logger.error(`❌ Digest Error: ${error.message}`);
    }
};

// ─── Scheduler ─────────────────────────────────────────────────────────────
const startReportingHub = () => {
    // Snapshots (Daily 00:00)
    cron.schedule('0 0 * * *', captureGlobalSnapshots);
    
    // Digests (Daily 08:00 UTC)
    cron.schedule('0 8 * * *', sendDailyDigests);

    logger.info('🕒 Reporting Hub Initialized (Analytics & Summaries scheduled)');
};

module.exports = {
    startReportingHub,
    captureGlobalSnapshots
};
