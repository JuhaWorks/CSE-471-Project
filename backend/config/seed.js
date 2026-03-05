const User = require('../models/user.model');
const logger = require('../utils/logger');

const seedAdminUser = async () => {
    try {
        // Look for any existing admin to prevent overwriting if the user manually changed passwords
        const existingAdmin = await User.findOne({ role: 'Admin', email: 'admin@klivra.com' });

        if (existingAdmin) {
            logger.info('🛡️  Master Admin account already exists. Seeding skipped.');
            return;
        }

        // If it doesn't exist, create the immutable master admin
        const adminUser = new User({
            name: 'Klivra Administrator',
            email: 'admin@klivra.com',
            password: process.env.ADMIN_PASSWORD || 'KlivraAdmin2026!',
            role: 'Admin',
            avatar: 'https://cdn-icons-png.flaticon.com/512/3286/3286168.png',
            authProviders: ['local'],
        });

        await adminUser.save();
        logger.info('🚀 Master Admin account seeded successfully: admin@klivra.com');
    } catch (error) {
        logger.error(`❌ Failed to seed Master Admin: ${error.message}`);
    }
};

module.exports = seedAdminUser;
