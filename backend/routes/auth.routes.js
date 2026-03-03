const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser);

// Protected Route: Get Logged In User Profile
router.get('/profile', protect, (req, res) => {
    // req.user is automatically populated by the protect middleware (excluding password)
    res.status(200).json({
        status: 'success',
        data: req.user
    });
});

module.exports = router;
