const Project = require('../models/project.model');

// @desc    Get all projects (that the user is part of)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
    try {
        // Only return projects where the user is listed in teamMembers
        const projects = await Project.find({
            'teamMembers.user': req.user._id,
        }).populate('teamMembers.user', 'name email').lean();

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
        const project = await Project.findById(req.params.id)
            .populate('teamMembers.user', 'name email role').lean();

        if (!project) {
            res.status(404);
            throw new Error('Project not found');
        }

        // Verify user is in project
        const isMember = project.teamMembers.some(
            (member) => member.user._id.toString() === req.user._id.toString()
        );

        if (!isMember && req.user.role !== 'admin') {
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
        const { name, description } = req.body;

        // The user creating the project is automatically added as a manager
        const project = await Project.create({
            name,
            description,
            teamMembers: [{ user: req.user._id, role: 'manager' }],
        });

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
        let project = await Project.findById(req.params.id);

        if (!project) {
            res.status(404);
            throw new Error('Project not found');
        }

        // Checking if the user has the 'manager' role in the project
        const isManager = project.teamMembers.some(
            (m) => m.user.toString() === req.user._id.toString() && m.role === 'manager'
        );

        if (!isManager && req.user.role !== 'admin') {
            res.status(401);
            throw new Error('User not authorized to update project');
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ status: 'success', data: project });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            res.status(404);
            throw new Error('Project not found');
        }

        const isManager = project.teamMembers.some(
            (m) => m.user.toString() === req.user._id.toString() && m.role === 'manager'
        );

        if (!isManager && req.user.role !== 'admin') {
            res.status(401);
            throw new Error('User not authorized to delete project');
        }

        await project.deleteOne();

        // Optionally: cascading delete of tasks associated with this project

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
