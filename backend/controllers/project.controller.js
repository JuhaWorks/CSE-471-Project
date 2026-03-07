const Project = require('../models/project.model');
const ProjectActivity = require('../models/projectActivity.model');

// Helper for activity logging
const logActivity = async (projectId, actorId, action, metadata = {}) => {
    try {
        await ProjectActivity.create({ projectId, actorId, action, metadata });
    } catch (err) {
        console.error('Failed to log project activity:', err.message);
    }
};

// @desc    Get all projects (that the user is part of and NOT soft-deleted)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
    try {
        // Filter out projects where deletedAt is NOT null
        const projects = await Project.find({
            'members.userId': req.user._id,
            deletedAt: null,
        }).populate('members.userId', 'name email').lean();

        res.status(200).json({
            status: 'success',
            count: projects.length,
            data: projects,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res, next) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, deletedAt: null })
            .populate('members.userId', 'name email role').lean();

        if (!project) {
            res.status(404);
            throw new Error('Project not found');
        }

        // Verify user is in project
        const isMember = project.members.some(
            (member) => member.userId._id.toString() === req.user._id.toString()
        );

        if (!isMember && req.user.role !== 'Admin') {
            res.status(403);
            throw new Error('User not authorized to access this project');
        }

        res.status(200).json({ status: 'success', data: project });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
    try {
        const { name, description, category, startDate, endDate } = req.body;

        // Date validation
        if (new Date(endDate) <= new Date(startDate)) {
            res.status(400);
            return next(new Error('End date cannot precede the start date.'));
        }

        // The user creating the project is automatically added as a Manager
        const project = await Project.create({
            name,
            description,
            category,
            startDate,
            endDate,
            members: [{ userId: req.user._id, role: 'Manager' }],
        });

        await logActivity(project._id, req.user._id, 'PROJECT_CREATED', { name: project.name });

        res.status(201).json({ status: 'success', data: project });
    } catch (error) {
        next(error);
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res, next) => {
    try {
        let project = await Project.findOne({ _id: req.params.id, deletedAt: null });

        if (!project) {
            res.status(404);
            throw new Error('Project not found');
        }

        // Authorization check
        const member = project.members.find(
            (m) => m.userId.toString() === req.user._id.toString()
        );
        const isAuthorized = (member && (member.role === 'Manager' || member.role === 'Editor')) || req.user.role === 'Admin';

        if (!isAuthorized) {
            res.status(403);
            throw new Error('User not authorized to update project');
        }

        // Strict Date Validation
        const newStartDate = req.body.startDate || project.startDate;
        const newEndDate = req.body.endDate || project.endDate;

        if (new Date(newEndDate) <= new Date(newStartDate)) {
            res.status(400);
            return next(new Error('End date cannot precede the start date.'));
        }

        // Track changes for activity log
        const changes = {};
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== project[key]) {
                changes[key] = { from: project[key], to: req.body[key] };
            }
        });

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        await logActivity(project._id, req.user._id, 'PROJECT_UPDATED', changes);

        res.status(200).json({ status: 'success', data: project });
    } catch (error) {
        next(error);
    }
};

// @desc    Soft-delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, deletedAt: null });

        if (!project) {
            res.status(404);
            throw new Error('Project not found');
        }

        const isManager = project.members.some(
            (m) => m.userId.toString() === req.user._id.toString() && m.role === 'Manager'
        );

        if (!isManager && req.user.role !== 'Admin') {
            res.status(403);
            throw new Error('User not authorized to delete project');
        }

        // Implementation of Soft-Delete
        project.deletedAt = Date.now();
        await project.save();

        await logActivity(project._id, req.user._id, 'PROJECT_DELETED', { name: project.name });

        res.status(200).json({ status: 'success', data: {} });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
};

