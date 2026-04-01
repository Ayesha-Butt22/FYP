const Template = require('../models/Template');
const fs = require('fs');
const path = require('path');

// @desc    Upload a template
// @route   POST /api/templates/upload
exports.uploadTemplate = async (req, res) => {
    try {
        console.log('Upload request received');
        console.log('File:', req.file);
        console.log('Body:', req.body);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { template, department } = req.body;

        if (!template || !department) {
            // Delete uploaded file if validation fails
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: 'Template and department are required'
            });
        }

        // Check if template already exists for this department
        const existingTemplate = await Template.findOne({
            template: template,
            department: department.toUpperCase()
        });

        if (existingTemplate) {
            // Delete newly uploaded file
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: `Template ${template} already exists for ${department} department`
            });
        }

        // Create file path for database
        const filePath = `/uploads/templates/${req.file.filename}`;

        const newTemplate = await Template.create({
            template: template,
            department: department.toUpperCase(),
            originalName: req.file.originalname,
            fileName: req.file.filename,
            filePath: filePath,
            fileSize: req.file.size,
            fileType: path.extname(req.file.originalname),
            uploadedBy: req.body.uploadedBy || 'Admin'
        });

        console.log('Template saved to DB:', newTemplate);

        res.status(201).json({
            success: true,
            message: 'Template uploaded successfully',
            data: newTemplate
        });

    } catch (error) {
        console.error('Upload error:', error);
        
        // Delete file if error occurs
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        // Handle duplicate key error (if unique index is added)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Template already exists for this department'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get all templates (with department filter)
// @route   GET /api/templates
exports.getAllTemplates = async (req, res) => {
    try {

        
        const { department } = req.query;
        
        let filter = {};
        if (department && department !== 'All') {
            filter.department = department.toUpperCase();
        }

        const templates = await Template.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: templates.length,
            data: templates
        });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get template by ID
// @route   GET /api/templates/:id
exports.getTemplateById = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        res.status(200).json({
            success: true,
            data: template
        });
    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Update template
// @route   PUT /api/templates/:id
exports.updateTemplate = async (req, res) => {
    try {
        const { template, department } = req.body;
        const templateId = req.params.id;

        // Find existing template
        const existingTemplate = await Template.findById(templateId);
        if (!existingTemplate) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        // If file is being updated
        if (req.file) {
            // Delete old file
            const oldFilePath = path.join(__dirname, '..', existingTemplate.filePath);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }

            // Update with new file
            existingTemplate.originalName = req.file.originalname;
            existingTemplate.fileName = req.file.filename;
            existingTemplate.filePath = `/uploads/templates/${req.file.filename}`;
            existingTemplate.fileSize = req.file.size;
            existingTemplate.fileType = path.extname(req.file.originalname);
        }

        // Update other fields
        if (template) existingTemplate.template = template;
        if (department) existingTemplate.department = department.toUpperCase();

        await existingTemplate.save();

        res.status(200).json({
            success: true,
            message: 'Template updated successfully',
            data: existingTemplate
        });

    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Delete template
// @route   DELETE /api/templates/:id
exports.deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, '..', template.filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        } else {
            console.warn('File not found at path:', filePath);
        }

        // Delete from database
        await template.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Template deleted successfully'
        });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get templates by department (route parameter)
// @route   GET /api/templates/department/:dept
exports.getTemplatesByDepartment = async (req, res) => {
    try {
        const department = req.params.dept.toUpperCase();
        const templates = await Template.find({ department }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: templates.length,
            data: templates
        });
    } catch (error) {
        console.error('Department filter error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Download template file
// @route   GET /api/templates/download/:id
exports.downloadTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);

        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        const filePath = path.join(__dirname, '..', template.filePath);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }

        // Set download headers
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${template.originalName}"`);
        
        // Send file
        res.sendFile(path.resolve(filePath));

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};