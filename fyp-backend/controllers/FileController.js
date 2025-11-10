const path = require('path');
const fs = require('fs');
const FileModel = require('../models/files');


exports.uploadFile = async (req, res) => {
  try {
    console.log('uploadFile called, body:', req.body);
    console.log('file present:', !!req.file, req.file && { originalname: req.file.originalname, path: req.file.path });

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { template, department } = req.body;
    if (!template) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({ success: false, message: 'Template is required' });
    }
    if (!department) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({ success: false, message: 'Department is required' });
    }

    const fileName = path.basename(req.file.path);
    const fileUrl = `/Filesk/${fileName}`; 

    const doc = new FileModel({
      template,
      department,
      filePath: fileUrl
    });

    await doc.save();

    
    return res.json({
      success: true,
      data: {
        id: doc._id,
        template: doc.template,
        department: doc.department,
        filePath: doc.filePath,
        uploadedAt: doc.createdAt || doc.createdAt 
      },
    });
  } catch (err) {
    console.error('FileController.uploadFile error', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.listFiles = async (req, res) => {
  try {
    console.log('GET /api/files called');
    const files = await FileModel.find().sort({ createdAt: -1 }).lean();
    console.log('found files count:', (files && files.length) || 0);
    return res.json({ success: true, data: files });
  } catch (err) {
    console.error('FileController.listFiles error', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getFileById = async (req, res) => {
  try {
    const doc = await FileModel.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error('FileController.getFileById error', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const doc = await FileModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

    const filePathOnDisk = path.join(__dirname, '..', doc.filePath.replace(/^\/+/, ''));
    console.log('Deleting file on disk:', filePathOnDisk);
    if (fs.existsSync(filePathOnDisk)) {
      try { fs.unlinkSync(filePathOnDisk); } catch (e) { console.warn('unlink failed', e); }
    }

    await doc.remove();
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('FileController.deleteFile error', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};