const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
} = require('../controllers/project.controller');
const { getLogs } = require('../controllers/audit.controller'); // Reuse audit fetcher
const { protect } = require('../middlewares/auth.middleware');
const { cacheMiddleware } = require('../utils/redis');


// We can re-route requests into the task router for relationships
// e.g., GET /api/projects/:projectId/tasks
const taskRouter = require('./task.routes');
router.use('/:projectId/tasks', taskRouter);

// Apply auth middleware to all project routes
router.use(protect);

router.route('/')
    .get(cacheMiddleware('projects', 300), getProjects)
    .post(createProject);

router.route('/:id')
    .get(cacheMiddleware('project', 300), getProject)
    .put(updateProject)
    .delete(deleteProject);

// Project-specific Activity Log
router.get('/:projectId/activity', (req, res, next) => {
    req.query.entityId = req.params.projectId; // Reuse the audit controller logic
    return getLogs(req, res, next);
});


module.exports = router;
