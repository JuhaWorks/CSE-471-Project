const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
} = require('../controllers/project.controller');
const { protect } = require('../middlewares/auth.middleware');

// We can re-route requests into the task router for relationships
// e.g., GET /api/projects/:projectId/tasks
const taskRouter = require('./task.routes');
router.use('/:projectId/tasks', taskRouter);

// Apply auth middleware to all project routes
router.use(protect);

router.route('/')
    .get(getProjects)
    .post(createProject);

router.route('/:id')
    .get(getProject)
    .put(updateProject)
    .delete(deleteProject);

module.exports = router;
