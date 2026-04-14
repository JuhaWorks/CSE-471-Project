const mongoose = require('mongoose');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const dotenv = require('dotenv');

dotenv.config();

async function checkNotifications() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const latest = await Notification.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('recipient', 'name email notificationPrefs');

        console.log('--- LATEST NOTIFICATIONS ---');
        latest.forEach(n => {
            console.log(`[${n.createdAt.toISOString()}] ${n.title}`);
            console.log(`Recipient: ${n.recipient?.email} (${n.recipient?.name})`);
            console.log(`Type: ${n.type}, Priority: ${n.priority}`);
            console.log(`Emailed: ${n.isEmailed}, Read: ${n.isRead}, Archived: ${n.isArchived}`);
            console.log(`Prefs: ${JSON.stringify(n.recipient?.notificationPrefs || {})}`);
            console.log(`Metadata: ${JSON.stringify(n.metadata || {})}`);
            console.log('---------------------------');
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkNotifications();
