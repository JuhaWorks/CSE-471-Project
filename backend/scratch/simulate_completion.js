const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8']);

const User = require('../models/user.model');
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const notificationService = require('../services/notification.service');

const simulateCompletion = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Find the Editor and Manager
        const editor = await User.findOne({ email: 'juhayer.rahman@g.bracu.ac.bd' });
        const manager = await User.findOne({ email: 'juhayer29@gmail.com' });

        if (!editor || !manager) {
            console.error('Test users not found');
            process.exit(1);
        }

        // 2. Find a task in the dummy project
        const task = await Task.findOne({ title: 'Optimize Status Transitions' }).populate('project');
        if (!task) {
            console.error('Test task not found');
            process.exit(1);
        }

        const project = task.project;
        console.log(`Simulating completion of task: "${task.title}"`);
        console.log(`In project: "${project.name}"`);

        // Force roles for test consistency
        console.log('Force-syncing roles for simulation...');
        project.members = [
            { userId: manager._id, role: 'Manager', status: 'active' },
            { userId: editor._id, role: 'Editor', status: 'active' }
        ];
        await project.save();

        console.log(`Acting User (Editor): ${editor.name} (${editor._id})`);
        console.log(`Expected Recipient (Manager): ${manager.name} (${manager._id})`);

        // 3. Replicate the controller's notification logic EXACTLY
        const isCompleted = true; // Simulating moving to completed
        const oldStatus = 'In Progress';
        const newStatus = 'Completed';

        // Notify Logic from task.controller.js
        const assignees = task.assignees?.map(a => a._id || a) || [];
        
        // Find project managers
        const managers = project.members
            .filter(m => m.role === 'Manager' && m.status === 'active')
            .map(m => m.userId?._id || m.userId);

        console.log(`Project members found: ${JSON.stringify(project.members.map(m => ({ id: m.userId, role: m.role })))}`);
        console.log(`Managers identified: ${JSON.stringify(managers)}`);

        const recipients = [...new Set([...assignees, ...managers])];
        console.log(`Total recipient list: ${JSON.stringify(recipients)}`);

        // Simulation with multiple recipients: Manager AND another Assignee
        const extraAssigneeId = project.members.find(m => m.userId.toString() !== editor._id.toString() && m.userId.toString() !== manager._id.toString())?.userId || manager._id;
        
        console.log(`Starting notification loop for recipients...`);

        for (const recipientId of recipients) {
            // Don't notify self
            if (recipientId.toString() === editor._id.toString()) {
                console.log(`Skipping self-notification for Editor: ${recipientId}`);
                continue;
            }

            console.log(`Dispatching notification to recipient: ${recipientId}`);
            
            await notificationService.notify({
                recipientId,
                senderId: editor._id,
                type: 'StatusUpdate',
                priority: 'Urgent',
                title: 'Task Completed',
                message: `Task "${task.title}" has been completed by ${editor.name}`,
                link: `/tasks?project=${project._id}`,
                metadata: { 
                    taskId: task._id, 
                    projectId: project._id,
                    taskName: task.title,
                    projectName: project.name || 'Project'
                }
            });
        }

        console.log('--- Simulation Triggered ---');
        console.log('Check the terminal logs for [NOTIFY] and [EMAIL] outputs.');
        process.exit(0);
    } catch (error) {
        console.error('Simulation Error:', error);
        process.exit(1);
    }
};

simulateCompletion();
