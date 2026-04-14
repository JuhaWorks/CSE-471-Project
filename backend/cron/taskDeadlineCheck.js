const cron = require('node-cron');
const Task = require('../models/task.model');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

/**
 * Scans all active tasks and sends reminders for those due within 24 hours.
 */
const checkTaskDeadlines = async () => {
    try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find tasks due within 24 hours that haven't been notified yet
        // Status must not be 'Completed' or 'Archived'
        const tasks = await Task.find({
            dueDate: { $gte: now, $lte: tomorrow },
            reminderSent: false,
            status: { $ne: 'Completed' },
            isArchived: false
        }).populate('project', 'name');

        if (tasks.length === 0) return;

        let remindersSent = 0;

        for (const task of tasks) {
            const recipients = task.assignees?.length > 0 ? task.assignees : (task.assignee ? [task.assignee] : []);
            
            if (recipients.length === 0) continue;

            for (const recipientId of recipients) {
                await notificationService.notify({
                    recipientId: recipientId._id || recipientId,
                    type: 'Deadline',
                    priority: 'High',
                    title: 'Task Due Soon',
                    message: `Reminder: Your task "${task.title}" is due within 24 hours.`,
                    link: `/tasks?project=${task.project._id || task.project}`,
                    metadata: { 
                        taskId: task._id, 
                        projectId: task.project._id || task.project,
                        taskName: task.title,
                        projectName: task.project?.name || 'Project'
                    }
                });
            }

            // Mark as sent to prevent duplicate reminders in next run
            task.reminderSent = true;
            await task.save();
            remindersSent++;
        }

        if (remindersSent > 0) {
            logger.info(`⏰ Task Deadline Checker: Sent reminders for ${remindersSent} tasks.`);
        }
    } catch (error) {
        logger.error(`❌ Task Deadline Checker Error: ${error.message}`);
    }
};

/**
 * Start the cron scheduler
 */
const startTaskDeadlineChecker = () => {
    // Run every hour at the top of the hour
    cron.schedule('0 * * * *', () => {
        logger.info('⏰ Running hourly task deadline checks...');
        checkTaskDeadlines();
    });

    // Dev mode: Run every minute for easy testing
    if (process.env.NODE_ENV !== 'production') {
        logger.info('⏰ Task Deadline Service active (Dev Mode) - Running every minute for testing');
        cron.schedule('* * * * *', checkTaskDeadlines);
        // Also run once immediately on boot in dev
        setTimeout(checkTaskDeadlines, 5000);
    }
};

module.exports = startTaskDeadlineChecker;
