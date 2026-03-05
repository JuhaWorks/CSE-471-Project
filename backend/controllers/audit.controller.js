const Audit = require('../models/audit.model');

// @desc    Get paginated audit/activity logs
// @route   GET /api/audit
// @access  Private (Admin/Manager)
const getLogs = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const skip = (page - 1) * limit;

        // Build query filter if specific entityId is provided
        const filter = req.query.entityId ? { entityId: req.query.entityId } : {};

        const total = await Audit.countDocuments(filter);

        // Lean query for pure JS objects and fast reads
        const logs = await Audit.find(filter)
            .populate('user', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        res.status(200).json({
            status: 'success',
            count: logs.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            },
            data: logs,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLogs
};
