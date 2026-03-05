const redis = require('redis');

let redisClient;

const initRedis = async () => {
    // Determine Redis Connection String
    const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = redis.createClient({ url: REDIS_URL });

    redisClient.on('error', (error) => console.error(`❌ Redis Error: ${error}`));
    redisClient.on('connect', () => console.log('✅ Redis Connected Successfully!'));

    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Redis', err);
    }
};

const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('Redis Client not initialized');
    }
    return redisClient;
};

// Middleware to check cache before hitting DB
const cacheMiddleware = (keyPrefix, ttlSeconds = 300) => {
    return async (req, res, next) => {
        try {
            if (!redisClient || !redisClient.isReady) {
                return next(); // Fail gracefully if Redis is down
            }

            // Generate a unique cache key based on route, query, and user
            const key = `${keyPrefix}:${req.user?._id}:${req.originalUrl}`;
            const cachedData = await redisClient.get(key);

            if (cachedData) {
                console.log(`[Redis] Cache HIT for ${key}`);
                return res.status(200).json(JSON.parse(cachedData));
            }

            console.log(`[Redis] Cache MISS for ${key}`);

            // Monkey-patch res.json to intercept the response and save to Redis before sending to client
            const originalSend = res.json;
            res.json = function (body) {
                // Only cache successful GET responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redisClient.setEx(key, ttlSeconds, JSON.stringify(body))
                        .catch(err => console.error('Redis SetEx Error:', err));
                }
                originalSend.call(this, body);
            };

            next();
        } catch (err) {
            console.error('Redis Middleware Error:', err);
            next(); // Proceed to controller if cache fails
        }
    };
};

module.exports = {
    initRedis,
    getRedisClient,
    cacheMiddleware
};
