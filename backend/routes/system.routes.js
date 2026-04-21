const express = require('express');
const router = express.Router();
const { protect, verifyAdmin } = require('../middlewares/access.middleware');
const { cacheMiddleware } = require('../utils/system.utils');

// Controllers
const adminCtrl = require('../controllers/admin.controller');
const analyticsCtrl = require('../controllers/analytics.controller');
const toolCtrl = require('../controllers/tool.controller');
const projectCtrl = require('../controllers/project.controller');

// ─── 1. Admin & System Management ──────────────────────────────────────────
const adminRouter = express.Router();
adminRouter.get('/system/status', adminCtrl.getSystemStatus); // Public check

adminRouter.use(protect);

// Polymorphic access: users can fetch audit logs for projects they belong to
adminRouter.get('/audit', adminCtrl.getLogs);

adminRouter.use(verifyAdmin);

adminRouter.get('/users', adminCtrl.getUsers);
adminRouter.get('/stats', adminCtrl.getPlatformStats);
adminRouter.put('/users/:id/role', adminCtrl.updateUserRole);
adminRouter.put('/users/:id/ban', adminCtrl.toggleBanUser);
adminRouter.put('/system/maintenance', adminCtrl.toggleMaintenance);
adminRouter.get('/system/blocked-ips', adminCtrl.getBlockedIps);
adminRouter.put('/system/blocked-ips', adminCtrl.updateBlockedIps);

// ─── 2. Intelligence & Analytics ──────────────────────────────────────────
const analyticsRouter = express.Router();
analyticsRouter.use(protect);

analyticsRouter.get('/workspace', analyticsCtrl.getWorkspaceAnalytics);
analyticsRouter.get('/projects/:id', analyticsCtrl.getProjectAnalytics);
analyticsRouter.get('/projects/:id/leaderboard', analyticsCtrl.getProjectLeaderboard);

// ─── 3. Global Search ──────────────────────────────────────────────────────
const searchRouter = express.Router();
searchRouter.get('/', protect, projectCtrl.globalSearch);

// ─── 4. Specialized Tools & Proxies ────────────────────────────────────────
const toolRouter = express.Router();
toolRouter.get('/apod', toolCtrl.getApod); // Public APOD

toolRouter.use(protect);
toolRouter.get('/quotes', toolCtrl.getQuotes);
toolRouter.get('/weather', toolCtrl.getWeather);
toolRouter.get('/team-times', toolCtrl.getTeamIntelligence);
toolRouter.get('/reverse-geocode', toolCtrl.reverseGeocode);

module.exports = {
    adminRouter,
    analyticsRouter,
    searchRouter,
    toolRouter
};
