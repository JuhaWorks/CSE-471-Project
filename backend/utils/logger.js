const winston = require('winston');

// Define log colors for development
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston.addColors(colors);

// Redact sensitive keys from logs
const sensitiveKeys = ['password', 'token', 'refreshToken', 'accessToken', 'secret', 'authorization'];

const redactSensitiveData = winston.format((info) => {
    if (info.message && typeof info.message === 'object') {
        const sanitize = (obj) => {
            for (let key in obj) {
                if (sensitiveKeys.includes(key.toLowerCase())) {
                    obj[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitize(obj[key]);
                }
            }
        };
        sanitize(info.message);
    }
    return info;
});

// Format for development (Colorized text)
const devFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    redactSensitiveData(),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${typeof info.message === 'object' ? JSON.stringify(info.message) : info.message
            }`
    )
);

// Format for production (Structured JSON)
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    redactSensitiveData(),
    winston.format.json()
);

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
    transports: [
        new winston.transports.Console(),
        // Optional: Add file transport for production logs
        // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

module.exports = logger;
