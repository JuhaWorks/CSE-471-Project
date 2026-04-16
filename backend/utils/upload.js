const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/chat';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedExt = /\.(jpeg|jpg|png|gif|webp|mp4|webm|mov|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|txt)$/i;
        const extOk = allowedExt.test(file.originalname);
        // mimetype can be image/jpeg, video/mp4 etc — check if it contains an allowed keyword
        const mimeOk = /image|video|pdf|msword|officedocument|zip|text/.test(file.mimetype);

        if (extOk || mimeOk) {
            return cb(null, true);
        } else {
            cb(new Error('File type not supported'));
        }
    }
});

module.exports = upload;
