const Project = require('../models/project.model');
const User = require('../models/user.model');
const { logActivity } = require('../utils/activityLogger');

// @desc    Add member to project (Idempotent)
// @route   POST /api/projects/:id/members
const addMember = async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const userToAdd = await User.findOne({ email });

        if (!userToAdd) {
            res.status(404);
            throw new Error('User not found');
        }

        const project = await Project.findById(req.params.id);

        // Idempotency check
        const isAlreadyMember = project.members.some(m => m.userId.toString() === userToAdd._id.toString());
        if (isAlreadyMember) {
            return res.status(200).json({ status: 'success', message: 'User is already a member.' });
        }

        project.members.push({ userId: userToAdd._id, role: role || 'Viewer' });
        await project.save();

        await logActivity(project._id, req.user._id, 'MEMBER_ADDED', { memberName: userToAdd.name, role: role || 'Viewer' });

        // Broadcast update via Socket.io
        req.io.to(`project_${project._id}`).emit('projectUpdated', {
            id: project._id,
            type: 'MEMBER_ADDED',
            member: { userId: userToAdd._id, role: role || 'Viewer' }
        });

        res.status(200).json({ status: 'success', data: project.members });
    } catch (error) {
        next(error);
    }
};

// @desc    Update member role
// @route   PUT /api/projects/:id/members/:userId
const updateMemberRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        const project = await Project.findById(req.params.id);

        const memberIndex = project.members.findIndex(m => m.userId.toString() === req.params.userId);
        if (memberIndex === -1) {
            res.status(404);
            throw new Error('Member not found');
        }

        // Block demoting self if only manager
        if (req.params.userId === req.user._id.toString() && project.members[memberIndex].role === 'Manager' && role !== 'Manager') {
            const managerCount = project.members.filter(m => m.role === 'Manager').length;
            if (managerCount === 1) {
                res.status(400);
                throw new Error('You cannot demote yourself. Assign another Manager first.');
            }
        }

        project.members[memberIndex].role = role;
        await project.save();

        await logActivity(project._id, req.user._id, 'MEMBER_ROLE_UPDATED', { targetUserId: req.params.userId, newRole: role });

        // Broadcast update via Socket.io
        req.io.to(`project_${project._id}`).emit('projectUpdated', {
            id: project._id,
            type: 'MEMBER_ROLE_UPDATED',
            userId: req.params.userId,
            newRole: role
        });

        res.status(200).json({ status: 'success', data: project.members });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        const member = project.members.find(m => m.userId.toString() === req.params.userId);

        if (!member) {
            res.status(404);
            throw new Error('Member not found');
        }

        // Last Manager Standing Check
        if (member.role === 'Manager') {
            const managerCount = project.members.filter(m => m.role === 'Manager').length;
            if (managerCount === 1) {
                res.status(400);
                throw new Error('You cannot leave or be removed without transferring ownership first. Assign a new Manager or delete the project.');
            }
        }

        project.members = project.members.filter(m => m.userId.toString() !== req.params.userId);
        await project.save();

        await logActivity(project._id, req.user._id, 'MEMBER_REMOVED', { targetUserId: req.params.userId });

        // Broadcast update via Socket.io
        req.io.to(`project_${project._id}`).emit('projectUpdated', {
            id: project._id,
            type: 'MEMBER_REMOVED',
            userId: req.params.userId
        });

        res.status(200).json({ status: 'success', message: 'Member removed successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addMember,
    updateMemberRole,
    removeMember
};
