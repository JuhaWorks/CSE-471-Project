const User = require('../models/user.model');

// @desc    Get all users with pagination and search
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Build search query matching Name or Email
        const query = search ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } : {};

        // Exclude passwords
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.status(200).json({
            status: 'success',
            data: users,
            meta: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a user's role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['Admin', 'Manager', 'Developer'];
        if (!validRoles.includes(role)) {
            res.status(400);
            return next(new Error('Invalid role specified.'));
        }

        const user = await User.findById(id).select('-password');

        if (!user) {
            res.status(404);
            return next(new Error('User not found'));
        }

        // Prevent admin from stripping their own role
        if (user._id.toString() === req.user._id.toString() && role !== 'Admin') {
            res.status(400);
            return next(new Error('You cannot remove your own Admin privileges.'));
        }

        user.role = role;
        await user.save({ validateBeforeSave: false }); // Bypass password hook

        res.status(200).json({
            status: 'success',
            message: `User role updated to ${role}`,
            data: user
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Toggle Ban status (Ban/Unban)
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
const toggleBanUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).select('-password');

        if (!user) {
            res.status(404);
            return next(new Error('User not found'));
        }

        // Prevent admin from banning themselves
        if (user._id.toString() === req.user._id.toString()) {
            res.status(400);
            return next(new Error('You cannot ban yourself.'));
        }

        user.isBanned = !user.isBanned;

        // Optionally, if unbanning, you might want to ensure isActive is true 
        // if it was deactivated, but we'll stick strictly to isBanned flag here.
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: user.isBanned ? 'User has been banned successfully' : 'User ban has been lifted',
            data: {
                _id: user._id,
                isBanned: user.isBanned
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    updateUserRole,
    toggleBanUser
};
