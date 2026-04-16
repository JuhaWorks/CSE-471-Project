const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const catchAsync = require('../utils/catchAsync');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unread === 'true';

    const query = { recipient: req.user._id, isArchived: false };
    if (unreadOnly) query.isRead = false;

    const notifications = await Notification.find(query)
        .populate('sender', 'name avatar')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false, isArchived: false });

    res.status(200).json({
        status: 'success',
        unreadCount,
        pagination: {
            total,
            page,
            pages: Math.ceil(total / limit)
        },
        data: notifications
    });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = catchAsync(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user._id },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    res.status(200).json({ status: 'success', data: notification });
});

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = catchAsync(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
    );

    res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
});

// @desc    Archive a notification (soft delete)
// @route   PATCH /api/notifications/:id/archive
// @access  Private
const archiveNotification = catchAsync(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user._id },
        { isArchived: true },
        { new: true }
    );

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    res.status(200).json({ status: 'success', data: notification });
});

// @desc    Archive all notifications
// @route   PATCH /api/notifications/archive-all
// @access  Private
const archiveAll = catchAsync(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isArchived: false },
        { isArchived: true }
    );

    res.status(200).json({ status: 'success', message: 'All notifications archived' });
});

// @desc    Hard delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = catchAsync(async (req, res) => {
    const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        recipient: req.user._id
    });

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    res.status(200).json({ status: 'success', message: 'Notification deleted' });
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
const updatePreferences = catchAsync(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { notificationPrefs: req.body },
        { new: true, runValidators: true }
    ).select('notificationPrefs');

    res.status(200).json({ status: 'success', data: user.notificationPrefs });
});

// @desc    Send test notification
// @route   POST /api/notifications/test
// @access  Private
const sendTestNotification = catchAsync(async (req, res) => {
    const notificationService = require('../services/notification.service');
    const { type } = req.body; // 'toast' or 'email'

    await notificationService.notify({
        recipientId: req.user._id,
        senderId: req.user._id, // System usually, but self-test is fine
        type: 'Mention', // Hardcoded for test
        priority: 'Medium',
        title: 'Command Center Diagnostic',
        message: `This is a successful test of your ${type} notification system. Your current matrix settings are working as intended.`,
        link: '/settings/notifications',
        metadata: { projectName: 'System Diagnostic' }
    });

    res.status(200).json({ status: 'success', message: `Test ${type} dispatched` });
});

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    archiveAll,
    deleteNotification,
    updatePreferences,
    sendTestNotification
};
