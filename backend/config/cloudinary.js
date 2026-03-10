const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'klivra/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 200, height: 200, crop: 'fill' }], // Circle crops often handled on frontend
    },
});

const projectStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'klivra/projects',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 630, crop: 'fill' }], // Optimized for social sharing / banners
    },
});

module.exports = { cloudinary, avatarStorage, projectStorage };
