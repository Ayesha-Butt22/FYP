const express = require('express');
const router = express.Router();

// CORRECT: Import uploadTemplate from upload middleware
const { uploadTemplate: uploadTemplateMiddleware } = require('../middlewares/upload');

const {
    uploadTemplate: uploadTemplateController,
    getAllTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    getTemplatesByDepartment,
    downloadTemplate
} = require('../controllers/templateController');

// @route   POST /api/templates/upload
// @desc    Upload template file
router.post('/upload', uploadTemplateMiddleware.single('file'), uploadTemplateController);

// @route   GET /api/templates
// @desc    Get all templates
router.get('/', getAllTemplates);

// @route   GET /api/templates/:id
// @desc    Get template by ID
router.get('/:id', getTemplateById);

// @route   PUT /api/templates/:id
// @desc    Update template
router.put('/:id', uploadTemplateMiddleware.single('file'), updateTemplate);

// @route   DELETE /api/templates/:id
// @desc    Delete template
router.delete('/:id', deleteTemplate);

// @route   GET /api/templates/department/:dept
// @desc    Get templates by department
router.get('/department/:dept', getTemplatesByDepartment);

// @route   GET /api/templates/download/:id
// @desc    Download template file
router.get('/download/:id', downloadTemplate);

module.exports = router;