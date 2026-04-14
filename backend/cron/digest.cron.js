const cron = require('node-cron');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const sendEmail = require('../utils/sendEmail');
const logger = require('../utils/logger');

const sendDailyDigests = async () => {
    try {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // 1. Find all users who want digests
        const users = await User.find({ 'notificationPrefs.frequency': 'digest' }).select('email name notificationPrefs');

        for (const user of users) {
                                                                                                            // 2. Find pending notifications for this user
            const pendingNotifications = await Notification.find({
                recipient: user._id,
                isEmailed: false,
                createdAt: { $gte: twentyFourHoursAgo }
            }).sort('-createdAt').limit(50).lean();

            if (pendingNotifications.length === 0) continue;

            // 3. Build Digest Email
            const notificationListHtml = pendingNotifications.map(n => {
                const { taskName, projectName } = n.metadata || {};
                return `
                    <div style="margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #10b981;">
                        <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #111827;">${n.title}</h3>
                        <p style="margin: 0; font-size: 14px; color: #4b5563;">${n.message}</p>
                        
                        ${(taskName || projectName) ? `
                        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e5e7eb; font-size: 12px; color: #6b7280;">
                            ${taskName ? `<span><strong>Task:</strong> ${taskName}</span>` : ''}
                            ${(taskName && projectName) ? ' <span style="margin: 0 5px;">•</span> ' : ''}
                            ${projectName ? `<span><strong>Project:</strong> ${projectName}</span>` : ''}
                        </div>
                        ` : ''}

                        ${n.link ? `<a href="${process.env.FRONTEND_URL}${n.link}" style="display: inline-block; margin-top: 10px; font-size: 12px; color: #10b981; text-decoration: none; font-weight: bold;">View Details</a>` : ''}
                    </div>
                `;
            }).join('');

            await sendEmail({
                to: user.email,
                subject: `[Klivra] Your Daily Activity Digest - ${pendingNotifications.length} items`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
                        <h2 style="color: #10b981;">Daily Activity Digest</h2>
                        <p>Hi ${user.name}, here is a summary of the activity you missed today:</p>
                        <br/>
                        ${notificationListHtml}
                        <br/>
                        <hr style="border: 0; border-top: 1px solid #e5e7eb;" />
                        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                            You received this because your frequency is set to <strong>Daily Digest</strong>. 
                            <a href="${process.env.FRONTEND_URL}/profile" style="color: #10b981;">Change settings</a>.
                        </p>
                    </div>
                `
            });

            // 4. Mark notifications as emailed
            await Notification.updateMany(
                { _id: { $in: pendingNotifications.map(n => n._id) } },
                { isEmailed: true }
            );

            logger.info(`[DIGEST] Sent digest to ${user.email} with ${pendingNotifications.length} items.`);
        }
    } catch (error) {
        logger.error(`[DIGEST] Cron failed: ${error.message}`);
    }
};

const startDigestCron = () => {
    // Run daily at 8 AM UTC
    cron.schedule('0 8 * * *', () => {
        logger.info('⏰ Running daily notification digest job...');
        sendDailyDigests();
    });

    // Dev mode: Run every 5 minutes and immediately if explicitly allowed for testing
    if (process.env.NODE_ENV !== 'production') {
        logger.info('⏰ Notification Digest Service (Dev Mode) - Scheduled for testing.');
        // cron.schedule('*/5 * * * *', sendDailyDigests); // Uncomment to test in dev
    }
};

module.exports = startDigestCron;
