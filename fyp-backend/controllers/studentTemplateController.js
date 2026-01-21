const StudentUploadedTemplate = require("../models/StudentUploadedTemplate");
const fs = require("fs");
const path = require("path");

// Allowed file extensions per template type
const ALLOWED_EXT = {
  t01: [".doc", ".docx"],
  t02: [".doc", ".docx"],
  t03: [".ppt", ".pptx"],
  t04: [".doc", ".docx"],
  t05: [".doc", ".docx"],
  t06: [".ppt", ".pptx"],
  t07: [".ppt", ".pptx"],
};

// TEMPLATE SEQUENCE CHECK
const TEMPLATE_SEQUENCE = ["t01","t02","t03","t04","t05","t06","t07"];

// ---------------- UPLOAD TEMPLATE ----------------
exports.uploadTemplate = async (req, res) => {
  try {
    const { groupId, studentId, templateCode, templateLabel, week } = req.body;
    if (!groupId || !studentId || !templateCode || !templateLabel || !week) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!req.file) return res.status(400).json({ success: false, message: "File is required" });

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!ALLOWED_EXT[templateCode]?.includes(ext)) {
      return res.status(400).json({ success: false, message: `Invalid file type. Allowed: ${ALLOWED_EXT[templateCode].join(", ")}` });
    }

    // Sequence check
    const currentIndex = TEMPLATE_SEQUENCE.indexOf(templateCode);
    if (currentIndex > 0) {
      const prevTemplateCode = TEMPLATE_SEQUENCE[currentIndex - 1];
      const prevSubmitted = await StudentUploadedTemplate.findOne({
        groupId,
        templateCode: prevTemplateCode,
        status: { $in: ["Pending","Under Review","Approved"] },
      });
      if (!prevSubmitted) return res.status(400).json({ success: false, message: `You must submit ${prevTemplateCode} first.` });
    }

    // Handle re-upload if rejected
    const existing = await StudentUploadedTemplate.findOne({ groupId, templateCode, status: "Rejected" });
    if (existing) {
      if (fs.existsSync(existing.filePath)) fs.unlinkSync(existing.filePath);
      await existing.deleteOne();
    }

    const newTemplate = await StudentUploadedTemplate.create({
      groupId,
      studentId,
      templateCode,
      templateLabel,
      week,
      filePath: req.file.path,
      originalName: req.file.originalname,
      status: "Under Review",
    });

    res.json({ success: true, data: newTemplate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------- GET GROUP TEMPLATES ----------------
exports.getGroupTemplates = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId) return res.status(400).json({ success: false, message: "groupId is required" });

    const templates = await StudentUploadedTemplate.find({ groupId }).sort({ uploadedAt: 1 });
    res.json({ success: true, data: templates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

