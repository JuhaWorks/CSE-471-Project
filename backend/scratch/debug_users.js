const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8']);

const User = require('../models/user.model');

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const emails = ['juhayer29@gmail.com', 'juhayer.rahman@g.bracu.ac.bd'];
        const users = await User.find({ email: { $in: emails } });
        
        console.log('--- User Debug ---');
        users.forEach(u => {
            console.log(`Email: ${u.email}`);
            console.log(`Notification Prefs: ${JSON.stringify(u.notificationPrefs, null, 2)}`);
            console.log('---');
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
debug();
