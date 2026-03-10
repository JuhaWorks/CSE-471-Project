const multer = require('multer');
const { avatarStorage, projectStorage } = require('../config/cloudinary');

// Accept only image MIME types
const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        req.fileValidationError = 'Only image files are allowed';
        cb(null, false);
    }
};

// --- Avatar Upload Middleware ---
const _avatarMulter = multer({
    storage: avatarStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('avatar');

const uploadAvatarSync = (req, res, next) => {
    _avatarMulter(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            res.status(400);
            return next(new Error(`Multer Error: ${err.message}`));
        }
        if (err) {
            res.status(400);
            return next(new Error(err.message || 'File upload error'));
        }
        next();
    });
};

// --- Project Image Upload Middleware ---
const _projectMulter = multer({
    storage: projectStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB for high-res banners
}).single('coverImage');

const uploadProjectImageSync = (req, res, next) => {
    _projectMulter(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            res.status(400);
            return next(new Error(`Multer Error: ${err.message}`));
        }
        if (err) {
            res.status(400);
            return next(new Error(err.message || 'File upload error'));
        }
        next();
    });
};

module.exports = {
    uploadSingle: uploadAvatarSync, // Maintain backward compatibility
    uploadProjectImage: uploadProjectImageSync
};
