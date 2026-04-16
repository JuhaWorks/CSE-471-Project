const express = require('express');
const router = express.Router();
const { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    updatePreferences,
    sendTestNotification
} = require('../controllers/notification.controller');
const { protect } = require('../middlewares/access.middleware');

router.use(protect); // All notification routes are protected

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.put('/preferences', updatePreferences);
router.post('/test', sendTestNotification);

module.exports = router;
