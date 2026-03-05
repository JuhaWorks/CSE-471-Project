const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/audit.controller');
const { protect, authorizeRoles } = require('../middlewares/auth.middleware');

// Protect all audit routes
router.use(protect);

// Only admins can view the global audit log (adjust as needed for project managers)
router.get('/', authorizeRoles('Admin', 'Manager'), getLogs);

module.exports = router;
