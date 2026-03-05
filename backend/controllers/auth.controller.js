const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Generate JWT Access Token (Short-lived)
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// Generate JWT Refresh Token (Long-lived)
const generateRefreshToken = (id) => {
    // In a production app, use a separate JWT_REFRESH_SECRET. We stick to JWT_SECRET as fallback
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    return jwt.sign({ id }, secret, { expiresIn: '7d' });
};

// Utility function to send JWT inside an HttpOnly Cookie
const sendTokenResponse = (user, statusCode, res) => {
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const isProd = process.env.NODE_ENV === 'production';
    // sameSite: 'none' requires Secure=true in all modern browsers. Since local dev
    // is HTTP (Secure=false), it would reject the cookie entirely.
    // Thanks to your Vite proxy, dev requests are same-site anyway, so 'lax' works perfectly.
    const options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true, // Crucial: Cookie cannot be accessed via client-side scripts
        secure: isProd, // HTTPS only in production
        sameSite: isProd ? 'none' : 'lax', // 'none' for cross-site prod, 'lax' for local proxy
    };

    res
        .status(statusCode)
        .cookie('refreshToken', refreshToken, options)
        .json({
            status: 'success',
            accessToken,
            data: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
};


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, role, avatar } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        // Create user. The password will be hashed via the pre-save hook in the User model.
        const user = await User.create({
            name,
            email,
            password,
            role,
            avatar
        });

        if (user) {
            res.status(201).json({
                status: 'success',
                message: 'Registration successful. Please log in.',
                data: {
                    _id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar
                }
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        console.error('❌ Registration Error FULL:', error);

        // MongoDB duplicate key error (email already in use)
        if (error.code === 11000) {
            res.status(400);
            return next(new Error('An account with this email already exists. Please log in or use a different email.'));
        }
        // Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            res.status(400);
            return next(new Error(messages.join(', ')));
        }
        res.status(400);
        next(new Error(`Registration failed: ${error.message}`));
    }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const { email, password, reactivate } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error('Please provide an email and password');
        }

        // Check for user email. We need to explicitly select the password because
        // it was set to `select: false` in the schema.
        const user = await User.findOne({ email }).select('+password');

        // Check if user exists and password matches
        if (user && (await user.matchPassword(password))) {

            if (user.isBanned) {
                res.status(403);
                return next(new Error('Your account has been suspended for violating terms of service.'));
            }

            // Handle timed/manual deactivation reactivations
            if (!user.isActive) {
                if (reactivate === true) {
                    // Instantly reactivate the account on demand
                    user.isActive = true;
                    user.deactivationDate = null;
                    user.deactivationDuration = null;
                    await user.save();
                } else {
                    // Pre-flight check: Account is deactivated, tell the frontend to prompt them
                    res.status(403);
                    return next({
                        message: 'Your account is currently deactivated. Would you like to reactivate it and log in?',
                        requiresReactivation: true
                    });
                }
            }

            sendTokenResponse(user, 200, res);
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout // Normally POST but GET frequently used for ease
// @access  Public
const logoutUser = async (req, res, next) => {
    try {
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', 'none', {
            expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax'
        });

        res.status(200).json({
            status: 'success',
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Refresh access token using HTTP-Only refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshTokenUser = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken || refreshToken === 'none') {
            res.status(401);
            return next(new Error('Not authorized, no refresh token'));
        }

        const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
        const decoded = jwt.verify(refreshToken, secret);

        // Ensure user actually exists and is active
        const user = await User.findById(decoded.id).select('-password');
        if (!user || user.isActive === false) {
            const isProd = process.env.NODE_ENV === 'production';
            res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
            res.status(401);
            return next(new Error('Not authorized, user not found or deactivated'));
        }

        // Issue new short-lived access token
        const accessToken = generateAccessToken(user._id);

        res.status(200).json({
            status: 'success',
            accessToken
        });
    } catch (error) {
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
        res.status(401);
        next(new Error('Not authorized, refresh token failed/expired'));
    }
};

// @desc    OAuth Callback Handler
// @route   GET /api/auth/:provider/callback
// @access  Public
const oauthCallback = (req, res) => {
    // req.user is populated by passport
    const user = req.user;

    // We cannot use sendTokenResponse directly because that sends JSON.
    // OAuth requires a browser redirect back to the frontend SPA.
    // We will set the HttpOnly cookie manually, then redirect with the short-lived access token in the URL.

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const isProd = process.env.NODE_ENV === 'production';
    const options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
    };

    res.cookie('refreshToken', refreshToken, options);

    const frontendUrl = isProd
        ? 'https://klivra.vercel.app'
        : (process.env.FRONTEND_URL || 'http://localhost:5173');

    res.redirect(`${frontendUrl}/oauth/callback?token=${accessToken}`);
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    refreshTokenUser,
    oauthCallback
};
