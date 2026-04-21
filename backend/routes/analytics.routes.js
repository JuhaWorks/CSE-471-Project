const express = require('express');
const router = express.Router();
const analyticsCtrl = require('../controllers/analytics.controller');
const { protect } = require('../middlewares/access.middleware');
router.use(protect);

router.get('/workspace', analyticsCtrl.getWorkspaceAnalytics);
router.get('/projects/:id', analyticsCtrl.getProjectAnalytics);
router.get('/projects/:id/leaderboard', analyticsCtrl.getProjectLeaderboard);

module.exports = router;
