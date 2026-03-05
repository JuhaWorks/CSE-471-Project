const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, searchController.globalSearch);

module.exports = router;
