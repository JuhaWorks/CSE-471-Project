const Project = require('../models/project.model');
const mongoose = require('mongoose');

// @desc    Get project insights and analytics
// @route   GET /api/projects/:id/insights
const getProjectInsights = async (req, res, next) => {
    try {
        const { id } = req.params;
        const now = new Date();

        const insights = await Project.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: 'activities', // Map exactly to activity collection name
                    let: { projectId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$projectId', '$$projectId'] },
                                        { $gte: ['$createdAt', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'recentActivities'
                }
            },
            {
                $project: {
                    name: 1,
                    endDate: 1,
                    status: 1,
                    daysRemaining: {
                        $ceil: {
                            $divide: [
                                { $subtract: ['$endDate', now] },
                                1000 * 60 * 60 * 24
                            ]
                        }
                    },
                    activityVelocity: { $size: '$recentActivities' },
                    healthScore: {
                        $switch: {
                            branches: [
                                {
                                    case: { $lt: [{ $subtract: ['$endDate', now] }, 0] },
                                    then: 'Overdue'
                                },
                                {
                                    case: { $lt: [{ $subtract: ['$endDate', now] }, 7 * 24 * 60 * 60 * 1000] },
                                    then: 'At Risk'
                                }
                            ],
                            default: 'On Track'
                        }
                    }
                }
            }
        ]);

        if (!insights || insights.length === 0) {
            res.status(404);
            throw new Error('Project insights not found');
        }

        res.status(200).json({ status: 'success', data: insights[0] });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProjectInsights
};
