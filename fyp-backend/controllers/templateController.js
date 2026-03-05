// controllers/templateController.js - UPDATED
// logActivity calls added in uploadTemplate and deleteTemplate

const Template = require('../models/Template');
const fs = require('fs');
const path = require('path');
// Inline activity logger
const _logActivity = async (action, description, category, performedBy = "system", meta = {}) => {
  try {
    const ActivityLog = require("../models/ActivityLog");
    await ActivityLog.create({ action, description, category, performedBy, meta });
  } catch (err) {
    console.error("logActivity error (non-fatal):", err.message);
  }
};

// @desc    Upload a template
// @route   POST /api/templates/upload
exports.uploadTemplate = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { template, department } = req.body;

        if (!template || !department) {
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ success: false, message: 'Template and department are required' });
        }

        const existingTemplate = await Template.findOne({
            template: template,
            department: department.toUpperCase()
        });

        if (existingTemplate) {
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: `Template ${template} already exists for ${department} department`
            });
        }

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

        // ─── ACTIVITY LOG ───
        await _logActivity(
            "Template Uploaded",
            `Template "${template}" uploaded for ${department.toUpperCase()} department (File: ${req.file.originalname})`,
            "template",
            req.body.uploadedBy || "coordinator",
            { templateName: template, department: department.toUpperCase(), fileName: req.file.originalname }
        );

        res.status(201).json({ success: true, message: 'Template uploaded successfully', data: newTemplate });

    } catch (error) {
        console.error('Upload error:', error);
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Template already exists for this department' });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get all templates
// @route   GET /api/templates
exports.getAllTemplates = async (req, res) => {
    try {
        const { department } = req.query;
        let filter = {};
        if (department && department !== 'All') {
            filter.department = department.toUpperCase();
        }
        const templates = await Template.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: templates.length, data: templates });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get template by ID
// @route   GET /api/templates/:id
exports.getTemplateById = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
        res.status(200).json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update template
// @route   PUT /api/templates/:id
exports.updateTemplate = async (req, res) => {
    try {
        const { template, department } = req.body;
        const existingTemplate = await Template.findById(req.params.id);
        if (!existingTemplate) return res.status(404).json({ success: false, message: 'Template not found' });

        if (req.file) {
            const oldFilePath = path.join(__dirname, '..', existingTemplate.filePath);
            if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
            existingTemplate.originalName = req.file.originalname;
            existingTemplate.fileName     = req.file.filename;
            existingTemplate.filePath     = `/uploads/templates/${req.file.filename}`;
            existingTemplate.fileSize     = req.file.size;
            existingTemplate.fileType     = path.extname(req.file.originalname);
        }

        if (template)    existingTemplate.template   = template;
        if (department)  existingTemplate.department  = department.toUpperCase();
        await existingTemplate.save();

        res.status(200).json({ success: true, message: 'Template updated successfully', data: existingTemplate });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete template
// @route   DELETE /api/templates/:id
exports.deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

        const filePath = path.join(__dirname, '..', template.filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        } else {
            console.warn('File not found at path:', filePath);
        }

        // ─── ACTIVITY LOG ───
        await _logActivity(
            "Template Deleted",
            `Template "${template.template}" deleted for ${template.department} department`,
            "template",
            "coordinator",
            { templateName: template.template, department: template.department }
        );

        await template.deleteOne();
        res.status(200).json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get templates by department
// @route   GET /api/templates/department/:dept
exports.getTemplatesByDepartment = async (req, res) => {
    try {
        const department = req.params.dept.toUpperCase();
        const templates = await Template.find({ department }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: templates.length, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Download template file
// @route   GET /api/templates/download/:id
exports.downloadTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

        const filePath = path.join(__dirname, '..', template.filePath);
        if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found on server' });

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${template.originalName}"`);
        res.sendFile(path.resolve(filePath));
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};