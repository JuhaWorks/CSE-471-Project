const fs = require('fs');
const path = require('path');

/**
 * Strategic Taxonomy Mapping
 */
const DOMAIN_MAPPING = {
    Strategic: ['Epic', 'Feature', 'Story', 'Discovery', 'Research', 'Strategy'],
    Engineering: ['DevOps', 'Refactor', 'Technical Debt', 'QA', 'Performance', 'Engineering', 'Architecture'],
    Sustainability: ['Maintenance', 'Hygiene', 'Task', 'Sustainability', 'Security Patch', 'Legacy'],
    Operations: ['Bug', 'Security', 'Compliance', 'Meeting', 'Review', 'Support', 'Operations', 'Admin']
};

/**
 * Wraps an asynchronous function to catch errors.
 */
const catchAsync = (fn) => (req, res, next) => {
    fn(req, res, next).catch(next);
};

/**
 * Gets the frontend URL based on the environment.
 */
const getFrontendUrl = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return process.env.FRONTEND_URL || (isProd ? 'https://klivra.vercel.app' : 'http://localhost:5173');
};

/**
 * Formats a user object for standard API responses with self-healing radar logic.
 */
const formatUserResponse = (userDoc) => {
    const user = (userDoc && typeof userDoc.toObject === 'function') ? userDoc.toObject() : userDoc;
    const AXES = ['Strategic', 'Engineering', 'Sustainability', 'Operations'];
    const gamification = user.gamification || { 
        level: 1, xp: 0, specialties: { Strategic: 0, Engineering: 0, Sustainability: 0, Operations: 0 }, 
        badges: [], streaks: { current: 0, longest: 0, lastActivity: null }
    };
    if (!gamification.specialties) gamification.specialties = { Strategic: 0, Engineering: 0, Sustainability: 0, Operations: 0 };
    
    // Absolute benchmark for Radar maturity
    const RADAR_BENCHMARK = 500; 
    const normalizedSpecialties = {};
    const specialtiesObj = (gamification.specialties instanceof Map) ? Object.fromEntries(gamification.specialties) : (gamification.specialties || {});

    AXES.forEach(axis => {
        const points = specialtiesObj[axis] || 0;
        const raw = Math.min(100, (points / RADAR_BENCHMARK) * 100);
        normalizedSpecialties[axis] = points > 0 ? Math.max(5, Math.round(raw)) : 0;
    });

    return {
        _id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        coverImage: user.coverImage,
        bio: user.bio,
        skills: user.skills || [],
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        customMessage: user.customMessage,
        location: user.location,
        timezoneOffset: user.timezoneOffset,
        timezoneName: user.timezoneName,
        interfacePrefs: user.interfacePrefs,
        lastActive: user.lastActive,
        totalConnections: user.totalConnections ?? 0,
        gamification: { ...gamification, specialties: specialtiesObj, normalizedSpecialties }
    };
};

/**
 * Options for secure cookies with Safari/Chrome SameSite compatibility.
 */
const getCookieOptions = (rememberMe = false) => {
    const frontendUrl = getFrontendUrl();
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Improved Safari/Mobile Local Detection: 
    // Check for localhost, 127.0.0.1, and private IP ranges (192.168, 10.x, 172.x)
    // This ensures physical devices (iPhone/Mac) testing on the local network 
    // don't get 'secure: true' on 'http' connections which Safari would block.
    const isLocalIP = /(^127\.)|(^192\.168\.)|(^10\.)|(^172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(frontendUrl.replace('http://', '').replace('https://', ''));
    const isLocal = !isProduction || frontendUrl.includes('localhost') || isLocalIP;
    
    // Safari Fix: When proxied via Vercel, everything is effectively same-site.
    // 'lax' is much more compatible with Safari than 'none' in many proxied scenarios.
    const options = { 
        httpOnly: true, 
        secure: isProduction && !isLocalIP, // Only force secure in production and NOT on local IPs
        sameSite: isLocal ? 'lax' : 'none' 
    };

    if (rememberMe) options.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return options;
};

/**
 * Robustly checks if maintenance mode is effectively active.
 */
const checkMaintenanceStatus = (maintenanceValue) => {
    const details = maintenanceValue || { enabled: false, endTime: null };
    const enabled = !!details.enabled;
    const endTime = details.endTime ? new Date(details.endTime) : null;
    const isPast = endTime && endTime.getTime() < Date.now();
    return { isMaintenance: enabled && !isPast, endTime, autoRepairNeeded: enabled && isPast };
};

module.exports = {
    DOMAIN_MAPPING,
    catchAsync,
    getFrontendUrl,
    formatUserResponse,
    getCookieOptions,
    checkMaintenanceStatus
};
