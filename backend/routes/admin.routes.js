const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole, toggleBanUser } = require('../controllers/admin.controller');
const { protect, verifyAdmin } = require('../middlewares/auth.middleware');
router.use(protect);
router.use(verifyAdmin);

// Routes
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/ban', toggleBanUser);

module.exports = router;
