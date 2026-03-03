const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Determine the connection string to use. Use MONGO_URI from env variables.
        // If not present, fallback to a local MongoDB instance.
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/my_database';

        // Connect to MongoDB
        const conn = await mongoose.connect(uri);

        console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // Exit process with failure if connection drops
        process.exit(1);
    }
};

module.exports = connectDB;
