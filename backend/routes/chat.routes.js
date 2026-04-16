const express = require('express');
const router = express.Router();
const {
    getUserChats, 
    getChatMessageHistory, 
    sendMessage,
    unsendMessage,
    toggleBubble,
    archiveChat,
    deleteUserChat
} = require('../controllers/chat.controller');
const { protect } = require('../middlewares/access.middleware');
const upload = require('../utils/upload');

router.use(protect);

router.get('/', getUserChats);
router.get('/:chatId/messages', getChatMessageHistory);
router.post('/send', sendMessage);
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    const url = `${req.protocol}://${req.get('host')}/uploads/chat/${req.file.filename}`;
    res.status(200).json({ 
        status: 'success', 
        data: { 
            url, 
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } 
    });
});
router.patch('/messages/:messageId/unsend', unsendMessage);
router.patch('/:chatId/bubble', toggleBubble);
router.patch('/:chatId/archive', archiveChat);
router.delete('/:chatId', deleteUserChat);

module.exports = router;
