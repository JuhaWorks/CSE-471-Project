const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams allows grabbing :projectId from the project router
const {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
} = require('../controllers/task.controller');
const { protect } = require('../middlewares/auth.middleware');

// Apply auth middleware to all task routes
router.use(protect);

router.route('/')
    .get(getTasks)
    .post(createTask);

router.route('/:id')
    .put(updateTask)
    .delete(deleteTask);

module.exports = router;
