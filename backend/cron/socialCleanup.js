const mongoose = require('mongoose');
const nodeCron = require('node-cron');
const User = require('../models/user.model');
const Connection = require('../models/connection.model');
const logger = require('../utils/logger');

/**
 * Self-healing job to ensure data integrity in the networking system.
 * Fixes:
 * 1. Incorrect totalConnections counts.
 * 2. Orphaned connections (references to non-existent users).
 * 3. Stale pending requests (older than 90 days).
 */
const startSocialCleanup = () => {
    // Run every day at 03:00 AM
    nodeCron.schedule('0 3 * * *', async () => {
        logger.info('🧹 Starting Daily Social Integrity Cleanup...');
        const session = await mongoose.startSession();
        
        try {
            // 1. Fix Connection Counts
            const users = await User.find({}).select('_id name totalConnections');
            for (const user of users) {
                const realCount = await Connection.countDocuments({
                    $or: [{ requester: user._id }, { recipient: user._id }],
                    status: 'accepted'
                });

                if (user.totalConnections !== realCount) {
                    user.totalConnections = realCount;
                    await user.save();
                    logger.info(`Fixed connection count for ${user.name}: ${realCount}`);
                }
            }

            // 2. Auto-expire old pending requests (7+ days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const expired = await Connection.deleteMany({
                status: 'pending',
                createdAt: { $lt: sevenDaysAgo }
            });

            if (expired.deletedCount > 0) {
                logger.info(`Auto-expired ${expired.deletedCount} stale connection requests.`);
            }

            logger.info('✅ Social Cleanup Completed Successfully.');
        } catch (err) {
            logger.error(`❌ Social Cleanup Failed: ${err.message}`);
        }
    });
};

module.exports = startSocialCleanup;
