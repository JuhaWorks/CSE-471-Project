const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const {
    updateProfile,
    updateSecurity,
    deactivateAccount,
    deleteAccount
} = require('../controllers/settings.controller');

// GET    /api/settings/email/confirm/:token - Step 3: Confirm token and swap email
// This endpoint is PUBLIC to allow access from email clients
const { confirmEmailChange } = require('../controllers/user.controller');
router.get('/email/confirm/:token', confirmEmailChange);

// All other settings routes must be protected
router.use(protect);

// PUT    /api/settings/deactivate   - Deactivate user account (isActive = false)
router.put('/deactivate', deactivateAccount);

// DELETE /api/settings/delete       - Delete user account and cascade changes
router.delete('/delete', deleteAccount);

module.exports = router;
