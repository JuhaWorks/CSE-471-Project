const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/user.model');
const Connection = require('../models/connection.model');

// Load env vars from root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
    try {
        console.log('🚀 Starting Connection Count Migration...');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const users = await User.find({});
        console.log(`📊 Processing ${users.length} users...`);

        for (const user of users) {
            const count = await Connection.countDocuments({
                $or: [{ requester: user._id }, { recipient: user._id }],
                status: 'accepted'
            });

            user.totalConnections = count;
            await user.save();
            console.log(`👤 Updated ${user.name}: ${count} connections`);
        }

        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
