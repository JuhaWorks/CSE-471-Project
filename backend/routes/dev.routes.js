const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Task = require('../models/task.model');
const Audit = require('../models/audit.model');
const { protect } = require('../middlewares/access.middleware');
const { formatUserResponse } = require('../utils/helpers');

// Secure Dev Endpoints
router.use(protect);

/**
 * GET /api/dev/inspect
 * Returns the raw gamification state for the authenticated user.
 */
router.get('/inspect', async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const history = await Audit.find({ 
            user: user._id,
            action: 'EntityCreate',
            entityType: 'Task'
        }).limit(50).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: {
                rawGamification: user.gamification,
                formatted: formatUserResponse(user).specialties,
                recentAuditCount: history.length,
                recentAudits: history.map(h => ({
                    date: h.createdAt,
                    type: h.details?.type,
                    status: h.details?.status
                }))
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/dev/prime
 * Triggers a manual re-calculation of specialties if needed.
 */
router.get('/prime', async (req, res, next) => {
    try {
        // This endpoint can be used to trigger internal re-syncs if required.
        // For now, we rely on the vanguardPrime.js script for deep injection.
        res.status(200).json({
            status: 'success',
            message: 'Dev Priming endpoint active. Use vanguardPrime.js for high-density injection.'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
