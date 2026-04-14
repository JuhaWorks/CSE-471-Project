const User = require('../models/user.model');
const Audit = require('../models/audit.model');
const socketUtil = require('../utils/socket');
const logger = require('../utils/logger');

const LEVEL_THRESHOLDS = {
    1: 0,
    2: 100,      // +100
    3: 300,      // +200
    4: 600,      // +300
    5: 1000,     // +400
    6: 1500,     // +500
    7: 2100,     // +600
    8: 2800,     // +700
    9: 3600,     // +800
    10: 4500     // +900
};

/**
 * Growing Curve: Requirement grows by (Level * 500) after level 10
 */
const getRequiredXP = (level) => {
    if (level <= 10) return LEVEL_THRESHOLDS[level] || 0;
    
    // Recursive-like growth formula for 10+
    // L11: 4500 + 11*500 = 10,000
    // L12: 10000 + 12*500 = 16,000
    let total = LEVEL_THRESHOLDS[10];
    for (let i = 11; i <= level; i++) {
        total += (i * 500);
    }
    return total;
};

const calculateTaskXP = (task, context = {}) => {
    let xp = 100; // Boosted Base XP

    // 1. Priority Bonus
    switch (task.priority) {
        case 'Medium': xp += 20; break;
        case 'High': xp += 50; break;
        case 'Urgent': xp += 100; break;
    }

    // 2. Complexity & Type Multipliers
    const typeMultipliers = {
        'Bug': 1.25,
        'Feature': 1.15,
        'Maintenance': 1.05,
        'Task': 1.0
    };
    xp *= (typeMultipliers[task.type] || 1.0);

    // 3. Breadth Bonus (Subtask weight)
    if (task.subtasks && task.subtasks.length > 0) {
        xp += (task.subtasks.length * 10);
    }

    // 4. Pathfinder Bonus (Unblocking others)
    if (context.wasBlocked) {
        xp += 100; // Static bonus for clearing a blocker
    }

    // 5. Efficiency Bonus (Time vs Estimate)
    if (task.estimatedTime > 0 && task.actualTime > 0) {
        const ratio = task.estimatedTime / task.actualTime;
        if (ratio > 1) {
            const timeMultiplier = Math.min(1.5, 1 + (ratio - 1) * 0.5);
            xp *= timeMultiplier;
        }
    }

    // 6. Collaboration Bonus
    if (task.assignees?.length >= 3) {
        xp *= 1.2;
    }

    // 7. Early Bird Bonus
    if (task.dueDate && new Date() < new Date(task.dueDate)) {
        const timeDiff = new Date(task.dueDate) - new Date();
        const daysEarly = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        if (daysEarly > 0) {
            xp += (Math.min(daysEarly, 5) * 20);
        }
    }

    return Math.round(xp);
};

/**
 * Awards XP, handles Level Ups, and assigns Badges
 */
const awardXP = async (userId, xpEarned, sourceTask = null, context = {}) => {
    try {
        const user = await User.findById(userId);
        if (!user) return null;

        // Initialize gamification nested properties safely
        if (!user.gamification) user.gamification = {};
        if (typeof user.gamification.xp !== 'number') user.gamification.xp = 0;
        if (typeof user.gamification.level !== 'number') user.gamification.level = 1;
        if (!user.gamification.streaks) user.gamification.streaks = { current: 0, longest: 0, lastActivity: null };

        // --- 1. Streak & Milestone Logic ---
        const now = new Date();
        const last = user.gamification.streaks.lastActivity;
        let milestoneBurst = 0;

        if (last) {
            const diffDays = Math.floor((now - new Date(last)) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                user.gamification.streaks.current += 1;
                if (user.gamification.streaks.current > user.gamification.streaks.longest) {
                    user.gamification.streaks.longest = user.gamification.streaks.current;
                }
                
                // Milestone Bursts
                if (user.gamification.streaks.current === 7 || user.gamification.streaks.current === 30) {
                    milestoneBurst = 1000;
                }
            } else if (diffDays > 1) {
                user.gamification.streaks.current = 0;
            }
        } else {
            user.gamification.streaks.current = 1;
            user.gamification.streaks.longest = 1;
        }
        user.gamification.streaks.lastActivity = now;

        // --- 2. Tiered Critical Roll ---
        let finalXp = xpEarned;
        let rollResult = 'standard';
        let multiplier = 1;

        if (sourceTask) {
            const roll = Math.random() * 100;
            if (roll > 99) { // 1%
                multiplier = 3;
                rollResult = 'legendary';
            } else if (roll > 94) { // 5%
                multiplier = 2;
                rollResult = 'critical';
            } else if (roll > 79) { // 15%
                multiplier = 1.5;
                rollResult = 'great';
            }
        }

        finalXp = Math.round(finalXp * multiplier) + milestoneBurst;

        const oldLevel = user.gamification.level;
        user.gamification.xp += finalXp;

        // Specialty Logic
        if (sourceTask && sourceTask.type) {
            const type = sourceTask.type;
            if (!user.gamification.specialties) user.gamification.specialties = {};
            user.gamification.specialties[type] = (user.gamification.specialties[type] || 0) + finalXp;
        }

        // --- 3. Growing Curve Level Check ---
        let newLevel = oldLevel;
        let nextThreshold = getRequiredXP(newLevel + 1);

        while (user.gamification.xp >= nextThreshold) {
            newLevel++;
            nextThreshold = getRequiredXP(newLevel + 1);
        }

        const leveledUp = newLevel > oldLevel;
        if (leveledUp) {
            user.gamification.level = newLevel;
            // Frames/Badges logic...
            if (!user.gamification.frames) user.gamification.frames = ['standard'];
            if (newLevel >= 5 && !user.gamification.frames.includes('bronze')) user.gamification.frames.push('bronze');
            if (newLevel >= 10 && !user.gamification.frames.includes('silver')) user.gamification.frames.push('silver');
            if (newLevel >= 25 && !user.gamification.frames.includes('gold')) user.gamification.frames.push('gold');
        }

        user.markModified('gamification');
        await User.updateOne({ _id: user._id }, { $set: { gamification: user.gamification } });

        // --- 4. Socket Announcements ---
        const io = socketUtil.getIO();
        if (io) {
            // Personal Update
            io.to(userId.toString()).emit('gamification_update', {
                type: leveledUp ? 'level_up' : 'xp_gained',
                xpGained: finalXp,
                rollResult,
                multiplier,
                milestoneBurst,
                newLevel: leveledUp ? newLevel : user.gamification.level,
                totalXP: user.gamification.xp,
                streak: user.gamification.streaks.current,
                userId: user._id,
                name: user.name
            });

            // Global Announcement for Legendary Wins
            if (rollResult === 'legendary') {
                io.emit('gamification_update', {
                    type: 'legendary_win',
                    name: user.name,
                    userId: user._id
                });
            }
        }

        return { xpGained: finalXp, rollResult, leveledUp, newLevel };

    } catch (error) {
        logger.error(`Gamification Engine Error (awardXP): ${error.message}`);
        return null;
    }
};

/**
 * Heuristic scan for milestone achievements.
 */
const checkBadges = async (user, task) => {
    // ... Existing badge logic (Bug Squasher, Early Bird) ...
    return null; // Simplified for brevity in this overhaul
};

/**
 * Revokes XP
 */
const revokeXP = async (userId, task) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.gamification) return null;

        const xpToRevoke = calculateTaskXP(task);
        user.gamification.xp = Math.max(0, user.gamification.xp - xpToRevoke);

        let newLevel = user.gamification.level || 1;
        while (newLevel > 1 && user.gamification.xp < getRequiredXP(newLevel)) {
            newLevel--;
        }

        user.gamification.level = newLevel;
        await User.updateOne({ _id: user._id }, { $set: { gamification: user.gamification } });

        return { xpLost: xpToRevoke, totalXP: user.gamification.xp, newLevel };
    } catch (error) {
        return null;
    }
};

module.exports = {
    calculateTaskXP,
    awardXP,
    revokeXP
};
