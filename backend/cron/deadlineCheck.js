const cron = require('node-cron');
const Project = require('../models/project.model');
const User = require('../models/user.model');
const sendEmail = require('../utils/sendEmail');
const logger = require('../utils/logger');

const checkDeadlines = async () => {
    try {
        const now = new Date();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

        // Find projects that are Active or Paused
        const projects = await Project.find({
            status: { $in: ['Active', 'Paused'] },
            deletedAt: null
        }).populate('members.userId', 'email name');

        let emailsSent = 0;

        for (const project of projects) {
            if (!project.endDate) continue;
            
            // Managers receive the alerts
            const managers = project.members
                .filter(m => m.role === 'Manager')
                .map(m => m.userId);

            if (managers.length === 0) continue;

            const timeDiff = project.endDate.getTime() - now.getTime();

            // 1. Exceeded Deadline Check
            if (timeDiff < 0 && !project.deadlineNotified?.exceeded) {
                // Deadline has passed
                for (const manager of managers) {
                    await sendEmail({
                        to: manager.email,
                        subject: `🚨 Deadline Exceeded: Project "${project.name}"`,
                        html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #ef4444;">Project Deadline Exceeded</h2>
                            <p>Hi ${manager.name},</p>
                            <p>This is a critical alert to inform you that the deadline for <strong>${project.name}</strong> has officially been exceeded.</p>
                            <p>Please log in to your dashboard immediately to either <strong>Extend the Deadline</strong> or <strong>Archive the Project</strong>.</p>
                            <br/>
                            <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
                        </div>
                        `
                    });
                    emailsSent++;
                }

                project.deadlineNotified = {
                    ...project.deadlineNotified,
                    exceeded: true
                };
                await project.save();
                continue; // Skip approaching check
            }

            // 2. Approaching Deadline Check (<= 3 days)
            if (timeDiff > 0 && timeDiff <= threeDaysMs && !project.deadlineNotified?.approaching) {
                const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                
                for (const manager of managers) {
                    await sendEmail({
                        to: manager.email,
                        subject: `⏳ Deadline Approaching: Project "${project.name}"`,
                        html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #f59e0b;">Project Deadline Approaching</h2>
                            <p>Hi ${manager.name},</p>
                            <p>This is a friendly reminder that the deadline for <strong>${project.name}</strong> is in <strong>${daysLeft} days</strong>.</p>
                            <p>Log in to your dashboard to review its status.</p>
                            <br/>
                            <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
                        </div>
                        `
                    });
                    emailsSent++;
                }

                project.deadlineNotified = {
                    ...project.deadlineNotified,
                    approaching: true
                };
                await project.save();
            }
        }

        if (emailsSent > 0) {
            logger.info(`⏰ Deadline Checker: Processed alerts and sent ${emailsSent} emails.`);
        }
    } catch (error) {
        logger.error(`❌ Deadline Checker Error: ${error.message}`);
    }
};

const startDeadlineChecker = () => {
    // Run daily at midnight 
    // Format: minute(0-59) hour(0-23) dayOfMonth(1-31) month(1-12) dayOfWeek(0-7)
    cron.schedule('0 0 * * *', () => {
        logger.info('⏰ Running daily project deadline checks...');
        checkDeadlines();
    });

    // In development mode, run immediately on startup for testing, and maybe every minute if requested
    if (process.env.NODE_ENV !== 'production') {
        logger.info('⏰ Deadline Checker Service active (Dev Mode) - Running every minute for testing');
        // Un-comment the line below to test every minute
        cron.schedule('* * * * *', checkDeadlines);
        
        // Also run once immediately on boot
        setTimeout(checkDeadlines, 2000);
    }
};

module.exports = startDeadlineChecker;
