const Audit = require('../models/audit.model');
const redis = require('redis');

// ─── 1. Logger (Bunyan-style high-density telemetry) ─────────────────────
const logger = {
    info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
    error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
    http: (msg) => console.log(`[HTTP] ${new Date().toISOString()} - ${msg}`),
    debug: (msg) => { if (process.env.NODE_ENV !== 'production') console.debug(`[DEBUG] ${new Date().toISOString()} - ${msg}`); }
};

// ─── 2. Redis (Caching Infrastructure) ───────────────────────────────────
let redisClient;
const initRedis = async () => {
    if (!process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
        logger.error('❌ REDIS_URL missing in production');
        return;
    }
    redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redisClient.on('error', (err) => logger.error(`Redis Error: ${err.message}`));
    await redisClient.connect();
    logger.info('🚀 Redis Connectivity Established');
};

const getRedisClient = () => redisClient;

const cacheMiddleware = (keyPrefix, duration = 3600) => async (req, res, next) => {
    if (!redisClient?.isOpen) return next();
    const key = `${keyPrefix}:${req.originalUrl || req.url}`;
    try {
        const cached = await redisClient.get(key);
        if (cached) return res.status(200).json(JSON.parse(cached));
        res.originalJson = res.json;
        res.json = (body) => {
            if (res.statusCode === 200) redisClient.setEx(key, duration, JSON.stringify(body));
            return res.originalJson(body);
        };
        next();
    } catch (err) { next(); }
};

const clearUserCache = async (keyPrefix, userId) => {
    try {
        if (!redisClient?.isOpen) return;
        const keys = await redisClient.keys(`${keyPrefix}:${userId}:*`);
        if (keys.length > 0) await redisClient.del(keys);
    } catch (err) { logger.error(`Redis Clear Error: ${err.message}`); }
};

// ─── 3. Activity Logger (Auditing Hub) ───────────────────────────────────
const logActivity = async (projectId, actorId, action, metadata = {}, entityType = 'Project', entityId = null) => {
    try {
        const finalEntityType = entityType !== 'Project' ? entityType : (projectId ? 'Project' : 'User');
        const finalEntityId = entityId || projectId || actorId;

        const auditEntry = await Audit.create({
            user: actorId, action, entityType: finalEntityType, entityId: finalEntityId,
            details: metadata || {}, ipAddress: metadata.ipAddress || 'System'
        });

        logger.info(`Activity Hub: ${action} by ${actorId}`);

        // Broadcast (Dynamic import to avoid circular dependency with service.utils)
        try {
            const { getIO } = require('./service.utils');
            const io = getIO();
            const populated = await auditEntry.populate('user', 'name avatar');
            if (finalEntityType === 'Security') io.to('admin_security').emit('security_event', populated);
            else {
                if (projectId) io.to(`project_${projectId}`).emit('project_activity', populated);
                io.emit('workspace_activity', populated);
            }
        } catch (sErr) {}
        return auditEntry;
    } catch (error) { logger.error(`Audit Failed: ${error.message}`); }
};

module.exports = {
    logger,
    initRedis,
    getRedisClient,
    cacheMiddleware,
    clearUserCache,
    logActivity,
    logSecurityEvent: (actorId, action, metadata) => logActivity(null, actorId, action, metadata, 'Security')
};
