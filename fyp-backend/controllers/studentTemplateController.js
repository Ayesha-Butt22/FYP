const StudentUploadedTemplate = require("../models/StudentUploadedTemplate");
const User = require("../models/User"); // only once
const fs = require("fs");
const path = require("path");
const getStudentMetaData = require("./getStudentMetaData");

// Allowed file extensions per template type
const ALLOWED_EXT = {
  t01: [".doc", ".docx"],
  t02: [".doc", ".docx"],
  t03: [".ppt", ".pptx"],
  t04: [".doc", ".docx"],
  t05: [".ppt", ".pptx"],
  t06: [".doc", ".docx"],
  t07: [".ppt", ".pptx"],
};

// Template sequence check
const TEMPLATE_SEQUENCE = ["t01","t02","t03","t04","t05","t06","t07"];

// ---------------- UPLOAD TEMPLATE ----------------
exports.uploadTemplate = async (req, res) => {
  try {
    const { studentId, templateCode, week } = req.body;

    if (!studentId || !templateCode || !week) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Fetch student info from DB
    const student = await User.findOne({ studentId: Number(studentId) }).select("department groupId");
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const { groupId, department } = student;

    if (!req.file) return res.status(400).json({ success: false, message: "File is required" });

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!ALLOWED_EXT[templateCode]?.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed: ${ALLOWED_EXT[templateCode].join(", ")}`,
      });
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
      if (!prevSubmitted) return res.status(400).json({
        success: false,
        message: `You must submit ${prevTemplateCode} first.`,
      });
    }

    // Handle re-upload if rejected
    const existing = await StudentUploadedTemplate.findOne({
      groupId,
      templateCode,
      status: "Rejected",
    });
    if (existing) {
      if (fs.existsSync(existing.filePath)) fs.unlinkSync(existing.filePath);
      await existing.deleteOne();
    }

    // Save new template
    const newTemplate = await StudentUploadedTemplate.create({
      groupId,
      studentId,
      templateCode,
      templateLabel: req.file.originalname,
      week,
      filePath: req.file.path,
      originalName: req.file.originalname,
      status: "Under Review",
    });

    res.json({ success: true, data: newTemplate });

  } catch (err) {
    console.error("UploadTemplate Error:", err);
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
    console.error("GetGroupTemplates Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------- GET STUDENT INFO BY NUMERIC studentId ----------------
exports.getStudentInfo = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) return res.status(400).json({ success: false, message: "Student ID required" });

    const student = await User.findOne({ studentId: Number(studentId) }).select("department groupId");
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

      const { group, proposal } = await getStudentMetaData({
          sapId: studentId
      });

    res.json({
      success: true,
      data: {
        department: student.department,
          groupId: group._id,
      },
    });
  } catch (err) {
    console.error("GetStudentInfo Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
