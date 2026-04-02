const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('./logger');
const { getRedisClient } = require('./redis');

let io;

module.exports = {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: (origin, cb) => {
                    const allowedOrigins = new Set([
                        'http://localhost:5173',
                        'http://localhost:5174',
                        'http://localhost:5175',
                        'http://localhost:3000',
                        'http://127.0.0.1:5173',
                        'https://klivra.vercel.app',
                        ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
                        process.env.FRONTEND_URL?.replace(/\/$/, '')
                    ].filter(Boolean).map(o => o.trim()));

                    if (!origin || allowedOrigins.has(origin)) cb(null, true);
                    else cb(new Error('Not allowed by CORS'));
                },
                credentials: true
            }
        });

        // Setup Redis Adapter for Clustering (if Redis is configured)
        const REDIS_URL = process.env.REDIS_URL || (process.env.NODE_ENV === 'production' ? null : 'redis://localhost:6379');
        if (REDIS_URL) {
            const { createClient } = require('redis');
            const pubClient = createClient({ url: REDIS_URL });
            const subClient = pubClient.duplicate();

            // Suppress background connection errors when Redis is not available
            pubClient.on('error', () => { });
            subClient.on('error', () => { });

            Promise.all([pubClient.connect(), subClient.connect()])
                .then(() => {
                    io.adapter(createAdapter(pubClient, subClient));
                    logger.info('🔗 Socket.IO configured with Redis Adapter for multi-worker sync.');
                })
                .catch(err => {
                    const errMsg = err?.message || 'Connection refused';
                    logger.warn(`⚠️ Failed to connect Redis Adapter (${errMsg}). Running in standalone mode.`);
                });
        }

        // JWT Authentication Middleware
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

                if (!token) {
                    return next(new Error('Authentication error: No token provided'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password');

                if (!user) {
                    return next(new Error('Authentication error: User not found'));
                }

                if (user.isBanned) {
                    return next(new Error('Authentication error: Account suspended'));
                }

                socket.user = user;
                next();
            } catch (err) {
                logger.error(`Socket Auth Error: ${err.message}`);
                next(new Error('Authentication error: Invalid token'));
            }
        });

        // --- DATA STRUCTURES ---
        // Room tracking: projectId -> { userId -> { name, avatar, status, sockets: Set } }
        const projectRooms = new Map();
        // Global tracking: userId -> { name, avatar, status, sockets: Set }
        const globalPresence = new Map();
        // Field locks: projectId -> { fieldId -> { userId, name } }
        // Field locks: projectId -> { fieldId -> { userId, name } }
        const activeLocks = new Map();
        // Disconnect grace period (to prevent reload flip-flop)
        const pendingDisconnects = new Map(); // userId -> timeoutId

        // --- BROADCAST HELPERS ---
        const getGlobalPresenceData = async () => {
            const redisClient = getRedisClient();
            if (redisClient && redisClient.isReady) {
                const data = await redisClient.hGetAll('presence:global');
                return Object.values(data).map(val => JSON.parse(val));
            }
            // Return FULL data including avatar for client-side merging
            return Array.from(globalPresence.entries()).map(([userId, userState]) => ({
                userId,
                name: userState.name,
                avatar: userState.avatar,
                status: userState.status
            }));
        };

        const broadcastGlobalPresence = async () => {
            const data = await getGlobalPresenceData();
            io.emit('globalPresenceUpdate', data);
        };

        // Push global presence directly to a single socket (instant, no round-trip)
        const pushPresenceToSocket = async (sock) => {
            const data = await getGlobalPresenceData();
            sock.emit('globalPresenceUpdate', data);
        };

        const getRoomViewers = (projectId) => {
            const roomData = projectRooms.get(projectId);
            if (!roomData) return [];

            return Array.from(roomData.entries()).map(([userId, userState]) => {
                // Enrich with live global status for accuracy
                const gState = globalPresence.get(userId);
                return {
                    userId,
                    name: userState.name,
                    avatar: userState.avatar,
                    status: gState ? gState.status : userState.status
                };
            });
        };

        const broadcastPresence = (projectId) => {
            const viewers = getRoomViewers(projectId);
            io.to(`project_${projectId}`).emit('presenceUpdate', viewers);
        };

        const broadcastLocks = (projectId) => {
            const locks = activeLocks.get(projectId) || {};
            io.to(`project_${projectId}`).emit('locksUpdated', locks);
        };

        // --- CONNECTION HANDLER ---
        io.on('connection', async (socket) => {
            const userId = socket.user._id.toString();
            logger.info(`🔌 Socket Connected: ${socket.user.name} (${socket.id})`);

            // Join a private room with the userID for targeted notifications
            socket.join(userId);
            logger.debug(`User ${socket.user.name} joined personal room: ${userId}`);

            // Cancel any pending disconnect for this user (e.g., they reloaded)
            if (pendingDisconnects.has(userId)) {
                clearTimeout(pendingDisconnects.get(userId));
                pendingDisconnects.delete(userId);
            }

            // 1. Initial Global Presence Setup
            if (!globalPresence.has(userId)) {
                let initialStatus = socket.user.status || 'Online';
                if (initialStatus === 'Offline') initialStatus = 'Online';

                const state = {
                    userId,
                    name: socket.user.name,
                    avatar: socket.user.avatar,
                    status: initialStatus
                };

                globalPresence.set(userId, { ...state, sockets: new Set() });

                // Sync to Redis for cross-cluster visibility
                const redisClient = getRedisClient();
                if (redisClient && redisClient.isReady) {
                    await redisClient.hSet('presence:global', userId, JSON.stringify(state));
                }

                if (socket.user.status === 'Offline') {
                    try {
                        await User.findByIdAndUpdate(userId, { status: 'Online' });
                    } catch (err) {
                        logger.error(`Failed to update initial status to Online for ${userId}: ${err.message}`);
                    }
                }
            }
            globalPresence.get(userId).sockets.add(socket.id);

            // INSTANT: push full presence directly to THIS socket right now
            // so they see all online users without any round-trip request
            await pushPresenceToSocket(socket);

            // Broadcast to everyone else that a new user is online
            await broadcastGlobalPresence();

            // Allow any client to request a fresh presence snapshot on demand
            socket.on('requestPresenceSync', async () => {
                await pushPresenceToSocket(socket);
            });

            // Track joined projects for this socket to cleanup on disconnect
            const joinedProjects = new Set();

            // Auto-join admins to the security feed room
            if (socket.user.role === 'Admin') {
                socket.join('admin_security');
                logger.info(`🔐 Admin ${socket.user.name} joined admin_security room`);
            }

            // 2. Project Room Joining
            socket.on('joinProject', (projectId) => {
                const roomKey = `project_${projectId}`;
                socket.join(roomKey);
                joinedProjects.add(projectId);

                if (!projectRooms.has(projectId)) {
                    projectRooms.set(projectId, new Map());
                }

                const roomData = projectRooms.get(projectId);

                if (!roomData.has(userId)) {
                    const gState = globalPresence.get(userId);
                    roomData.set(userId, {
                        name: socket.user.name,
                        avatar: socket.user.avatar,
                        status: gState ? gState.status : 'Online',
                        sockets: new Set()
                    });
                }

                roomData.get(userId).sockets.add(socket.id);

                logger.info(`👥 User ${socket.user.name} joined project: ${projectId}`);

                // INSTANT: broadcast updated room viewers to everyone in the room
                broadcastPresence(projectId);
                broadcastLocks(projectId);

                // INSTANT: also push fresh global presence directly to this socket
                // so they immediately see all globally-online users
                pushPresenceToSocket(socket);
            });

            // 3. Status Update (Active/Away/DND/Offline)
            // Throttled to 3 seconds to prevent spam
            const lastStatusUpdate = new Map();
            socket.on('setStatus', async ({ projectId, status }) => {
                const now = Date.now();
                if (lastStatusUpdate.has(userId) && now - lastStatusUpdate.get(userId) < 3000) return;
                lastStatusUpdate.set(userId, now);

                const gState = globalPresence.get(userId);
                if (gState && gState.status !== status) {
                    // 1. Update Globally
                    gState.status = status;

                    const redisClient = getRedisClient();
                    if (redisClient && redisClient.isReady) {
                        await redisClient.hSet('presence:global', userId, JSON.stringify({
                            userId, name: gState.name, avatar: gState.avatar, status: gState.status
                        }));
                    }

                    await broadcastGlobalPresence();

                    // 1.5 Notify all user's sockets to sync local store
                    gState.sockets.forEach(sId => {
                        io.to(sId).emit('statusUpdated', status);
                    });

                    // 2. Persist to DB for synchronization across sessions
                    try {
                        await User.findByIdAndUpdate(userId, { status });
                    } catch (err) {
                        logger.error(`Failed to update status in DB for ${userId}: ${err.message}`);
                    }

                    // 3. Update Project-wide if applicable
                    if (projectId) {
                        const roomData = projectRooms.get(projectId);
                        if (roomData && roomData.has(userId)) {
                            roomData.get(userId).status = status;
                            broadcastPresence(projectId);
                        }
                    } else {
                        // Update ALL projects this user is in
                        joinedProjects.forEach(pId => {
                            const roomData = projectRooms.get(pId);
                            if (roomData && roomData.has(userId)) {
                                roomData.get(userId).status = status;
                                broadcastPresence(pId);
                            }
                        });
                    }
                }
            });

            // 4. Field Locking
            socket.on('acquireFieldLock', ({ projectId, fieldId }) => {
                if (!activeLocks.has(projectId)) {
                    activeLocks.set(projectId, {});
                }

                const projectLocks = activeLocks.get(projectId);

                // If field is unlocked OR locked by same user (refresh case)
                if (!projectLocks[fieldId] || projectLocks[fieldId].userId === userId) {
                    projectLocks[fieldId] = {
                        userId,
                        userName: socket.user.name
                    };
                    broadcastLocks(projectId);
                }
            });

            socket.on('releaseFieldLock', ({ projectId, fieldId }) => {
                const projectLocks = activeLocks.get(projectId);
                if (projectLocks && projectLocks[fieldId]) {
                    if (projectLocks[fieldId].userId === userId) {
                        delete projectLocks[fieldId];
                        broadcastLocks(projectId);
                    }
                }
            });

            // 5. Leaving Projects
            socket.on('leaveProject', (projectId) => {
                socket.leave(`project_${projectId}`);
                joinedProjects.delete(projectId);

                const roomData = projectRooms.get(projectId);
                if (roomData) {
                    const userState = roomData.get(userId);

                    if (userState) {
                        userState.sockets.delete(socket.id);
                        if (userState.sockets.size === 0) {
                            roomData.delete(userId);
                        }
                    }

                    if (roomData.size === 0) {
                        projectRooms.delete(projectId);
                    }
                }

                broadcastPresence(projectId);
                logger.info(`👋 User ${socket.user.name} left project: ${projectId}`);
            });

            // 6. Generic Disconnect
            socket.on('disconnect', async () => {
                // Cleanup Project Rooms
                joinedProjects.forEach(projectId => {
                    const roomData = projectRooms.get(projectId);
                    if (roomData) {
                        const userState = roomData.get(userId);

                        if (userState) {
                            userState.sockets.delete(socket.id);
                            if (userState.sockets.size === 0) {
                                roomData.delete(userId);

                                // Instant Lock Release
                                const projectLocks = activeLocks.get(projectId);
                                if (projectLocks) {
                                    Object.keys(projectLocks).forEach(fId => {
                                        if (projectLocks[fId].userId === userId) {
                                            delete projectLocks[fId];
                                        }
                                    });
                                    broadcastLocks(projectId);
                                }
                            }
                        }

                        if (roomData.size === 0) {
                            projectRooms.delete(projectId);
                            // We keep activeLocks until meaningful expiry or manual release
                        }
                        broadcastPresence(projectId);
                    }
                });

                // Cleanup Global Presence
                const gState = globalPresence.get(userId);
                if (gState) {
                    gState.sockets.delete(socket.id);
                    if (gState.sockets.size === 0) {
                        // User has no more active sockets. 
                        // Start a grace period before marking them Offline/Removed.
                        const timeoutId = setTimeout(async () => {
                            globalPresence.delete(userId);
                            pendingDisconnects.delete(userId);
                            broadcastGlobalPresence();

                            logger.info(`👋 User ${socket.user.name} is now Offline (Grace period ended)`);

                            try {
                                await User.findByIdAndUpdate(userId, { status: 'Offline' });
                            } catch (err) {
                                logger.error(`Failed to set status Offline on disconnect for ${userId}: ${err.message}`);
                            }
                        }, 5000); // 5 second grace period for reloads

                        pendingDisconnects.set(userId, timeoutId);
                    }
                }
                logger.info(`🔌 Socket Disconnected: ${socket.id}`);
            });

            // 7. Whiteboard Orchestration (Clustered Pass-through)
            socket.on('join-whiteboard', (roomId) => {
                socket.join(`whiteboard_${roomId}`);
                logger.info(`🖌️ User ${socket.user.name} joined whiteboard: ${roomId}`);
            });

            socket.on('draw-line', ({ roomId, lineData }) => {
                // Emits to all other clients in the room (across all clusters via Redis)
                socket.to(`whiteboard_${roomId}`).emit('draw-line', lineData);
            });

            socket.on('clear-board', (roomId) => {
                socket.to(`whiteboard_${roomId}`).emit('clear-board');
            });
        });

        // ── PRESENCE HEARTBEAT ─────────────────────────────────────────
        // Re-broadcast global presence every 30s to all clients.
        // Acts as a self-healing mechanism if any client missed an update.
        const presenceHeartbeat = setInterval(async () => {
            if (globalPresence.size > 0) {
                await broadcastGlobalPresence();
            }
        }, 30000);

        // Clean up heartbeat if the server shuts down
        io.on('close', () => clearInterval(presenceHeartbeat));

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
