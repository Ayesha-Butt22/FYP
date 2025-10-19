const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const FileController = require('../controllers/FileController');
const router = express.Router();

// Ensure upload directory exists: fyp-backend/Filesk
const uploadDir = path.join(__dirname, '..', 'Filesk');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, safeName);
  }
});

const ALLOWED_EXTS = ['.doc', '.docx', '.ppt', '.pptx'];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) {
    return cb(new Error('Invalid file type'), false);
  }
  cb(null, true);
}

const upload = multer({ storage, limits: { fileSize: MAX_SIZE_BYTES }, fileFilter });

// POST /api/files/upload  (form-data: file, template, department)
router.post('/upload', upload.single('file'), FileController.uploadFile);

// GET /api/files
router.get('/', FileController.listFiles);

// GET /api/files/:id
router.get('/:id', FileController.getFileById);

// DELETE /api/files/:id
router.delete('/:id', FileController.deleteFile);

module.exports = router;