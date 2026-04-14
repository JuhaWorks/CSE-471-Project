const TaskComment = require('../models/taskComment.model');
const Task = require('../models/task.model');
const Audit = require('../models/audit.model');
const { logActivity } = require('../utils/activityLogger');
const socketUtil = require('../utils/socket');
const notificationService = require('../services/notification.service');

// @desc    Get all comments for a task
// @route   GET /api/tasks/:taskId/comments
// @access  Private
const getTaskComments = async (req, res, next) => {
    try {
        const comments = await TaskComment.find({ task: req.params.taskId })
            .populate('user', 'name email avatar')
            .sort('-createdAt')
            .lean();
        
        res.status(200).json({ status: 'success', data: comments });
    } catch (error) { next(error); }
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:taskId/comments
// @access  Private
const addTaskComment = async (req, res, next) => {
    try {
        const { content, mentions, attachments } = req.body;
        const taskId = req.params.taskId;

        const task = await Task.findById(taskId);
        if (!task) {
             res.status(404);
             throw new Error('Task not found');
        }

        const comment = await TaskComment.create({
            task: taskId,
            user: req.user._id,
            content,
            mentions,
            attachments
        });

        const populatedComment = await TaskComment.findById(comment._id).populate('user', 'name email avatar').lean();
        
        // Real-time notification
        // Real-time notification
        const io = socketUtil.getIO();
        const projectRoom = task.project.toString();
        io.to(projectRoom).emit('commentAdded', {
            taskId: taskId,
            comment: populatedComment
        });

        // Log in Audit system
        await logActivity(task.project.toString(), req.user._id, 'CommentAdded', {
            title: task.title,
            summary: `Added a comment: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
            content: content
        }, 'Task', taskId);

        // --- Notification Logic ---
        if (mentions && mentions.length > 0) {
            for (const recipientId of mentions) {
                // Don't notify self
                if (recipientId.toString() === req.user._id.toString()) continue;

                await notificationService.notify({
                    recipientId,
                    senderId: req.user._id,
                    type: 'Mention',
                    title: 'New Mention',
                    message: `${req.user.name} mentioned you in a comment on "${task.title}"`,
                    link: `/tasks?project=${task.project}`,
                    metadata: { taskId: task._id, projectId: task.project }
                });
            }
        }

        // --- Gamification Hook for Commenting ---
        const { awardXP } = require('../services/gamification.service');
        awardXP(req.user._id, 10, task).catch(err => console.error("Comment XP Error:", err));

        res.status(201).json({ status: 'success', data: populatedComment });
    } catch (error) { next(error); }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
// @access  Private
const deleteTaskComment = async (req, res, next) => {
    try {
        const comment = await TaskComment.findById(req.params.commentId);
        if (!comment) {
            res.status(404);
            throw new Error('Comment not found');
        }

        // Only author or admin can delete
        if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
            res.status(401);
            throw new Error('Not authorized to delete this comment');
        }

        await comment.deleteOne();
        res.status(200).json({ status: 'success', data: {} });
    } catch (error) { next(error); }
};

// @desc    Toggle emoji reaction on a comment
// @route   PATCH /api/tasks/:taskId/comments/:commentId/react
// @access  Private
const toggleReaction = async (req, res, next) => {
    try {
        const { emoji } = req.body;
        if (!emoji) { res.status(400); throw new Error('Emoji is required'); }

        const comment = await TaskComment.findById(req.params.commentId);
        if (!comment) { res.status(404); throw new Error('Comment not found'); }

        const userId = req.user._id.toString();
        const existingReaction = comment.reactions.find(r => r.emoji === emoji);

        if (existingReaction) {
            const idx = existingReaction.users.findIndex(u => u.toString() === userId);
            if (idx !== -1) {
                existingReaction.users.splice(idx, 1); // Remove reaction
            } else {
                existingReaction.users.push(req.user._id); // Add reaction
            }
            if (existingReaction.users.length === 0) {
                comment.reactions = comment.reactions.filter(r => r.emoji !== emoji);
            }
        } else {
            comment.reactions.push({ emoji, users: [req.user._id] });
        }

        await comment.save();

        // --- Gamification Hook for Reactions ---
        // Only award if it was an ADD (users array got longer)
        const isAdd = existingReaction ? comment.reactions.find(r => r.emoji === emoji).users.length > (existingReaction.users.length - 1) : true;
        if (isAdd) {
            const { awardXP } = require('../services/gamification.service');
            const task = await Task.findById(comment.task); // Need task for specialty context
            awardXP(req.user._id, 5, task).catch(err => console.error("Reaction XP Error:", err));
        }

        // Emit real-time update via socket
        if (req.io) {
            const task = await Task.findById(comment.task).select('project').lean();
            req.io.to(task?.project?.toString() || '').emit('commentReacted', {
                commentId: comment._id,
                reactions: comment.reactions
            });
        }

        res.status(200).json({ status: 'success', data: comment.reactions });
    } catch (error) { next(error); }
};

module.exports = {
    getTaskComments,
    addTaskComment,
    deleteTaskComment,
    toggleReaction
};
