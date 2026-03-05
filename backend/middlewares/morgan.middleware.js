const morgan = require('morgan');
const logger = require('../utils/logger');

// Override Morgan's stream to use our custom Winston logger
const stream = {
    // Use the 'http' severity
    write: (message) => logger.http(message.trim()),
};

// Skip requests depending on environment
const skip = () => {
    const env = process.env.NODE_ENV || 'development';
    return env !== 'development';
};

// Build the morgan middleware
// We use a custom format string to log method, url, status, response time, and content length
const morganMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    { stream, skip: () => false } // We can keep HTTP logs in prod if we want
);

module.exports = morganMiddleware;
