const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');
const {
    updateProfile,
    updateSecurity,
    deactivateAccount,
    deleteAccount
} = require('../controllers/settings.controller');

// All settings routes must be protected
router.use(protect);

// DEBUG: Log all requests to settings
router.use((req, res, next) => {
    console.log(`📍 Settings Route: ${req.method} ${req.path}`);
    next();
});

// PUT    /api/settings/profile      - Update name and about
router.put('/profile', updateProfile);

// PUT    /api/settings/security     - Update email and password
router.put('/security', updateSecurity);

// GET    /api/settings/email/confirm/:token - Step 3: Confirm token and swap email
const { confirmEmailChange } = require('../controllers/user.controller');
router.get('/email/confirm/:token', confirmEmailChange);

// PUT    /api/settings/deactivate   - Deactivate user account (isActive = false)
router.put('/deactivate', deactivateAccount);

// DELETE /api/settings/delete       - Delete user account and cascade changes
router.delete('/delete', deleteAccount);

module.exports = router;
