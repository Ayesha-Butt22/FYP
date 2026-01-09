const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads folder if doesn't exist
const ensureFolderExists = (folderPath) => {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
};

// Define allowed file types for templates
const ALLOWED_TEMPLATE_TYPES = ['.doc', '.docx', '.ppt', '.pptx'];
const MAX_TEMPLATE_SIZE = 20 * 1024 * 1024; // 20MB

// Template upload storage
const templateStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/templates/';
        ensureFolderExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp-random-originalname
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
        cb(null, uniquePrefix + '-' + safeName);
    }
});

// Template file filter
const templateFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (ALLOWED_TEMPLATE_TYPES.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_TEMPLATE_TYPES.join(', ')}`), false);
    }
};

// Create upload middleware for templates
const uploadTemplate = multer({
    storage: templateStorage,
    limits: { fileSize: MAX_TEMPLATE_SIZE },
    fileFilter: templateFileFilter
});

// Optional: For profile pictures (if you need it separate)
const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/profilepic/';
        ensureFolderExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniquePrefix + ext);
    }
});

const profileFileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (ALLOWED_IMAGE_TYPES.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`), false);
    }
};

const uploadProfile = multer({
    storage: profileStorage,
    limits: { fileSize: MAX_IMAGE_SIZE },
    fileFilter: profileFileFilter
});

module.exports = {
    uploadTemplate,
    uploadProfile
};