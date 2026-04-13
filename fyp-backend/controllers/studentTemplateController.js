const StudentUploadedTemplate = require("../models/StudentUploadedTemplate");
const User = require("../models/User");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const getStudentMetaData = require("./getStudentMetaData");

// Allowed file extensions
const ALLOWED_EXT = {
  t01: [".doc", ".docx", ".pdf"],
  t02: [".doc", ".docx", ".pdf"],
  t03: [".ppt", ".pptx"],
  t04: [".doc", ".docx", ".pdf"],
  t05: [".doc", ".docx", ".pdf"],
  t06: [".ppt", ".pptx"],
  t07: [".ppt", ".pptx"],
};

// Templates
const FYP1_TEMPLATES = ["t01", "t02", "t03", "t04", "t05", "t07"];
const FYP2_TEMPLATES = ["t05", "t06"];

// ---------- HELPERS ----------

// FYP-1 complete?
const isFyp1Completed = async (groupId) => {
  const approved = await StudentUploadedTemplate.find({
    groupId,
    fypPart: 1,
    templateCode: { $in: FYP1_TEMPLATES },
    status: "Approved",
  });
  return approved.length === FYP1_TEMPLATES.length;
};

// FYP-2 complete?
const isFyp2Completed = async (groupId) => {
  const approved = await StudentUploadedTemplate.find({
    groupId,
    fypPart: 2,
    templateCode: { $in: FYP2_TEMPLATES },
    status: "Approved",
  });
  return approved.length === FYP2_TEMPLATES.length;
};

// ---------- UPLOAD ----------
exports.uploadTemplate = async (req, res) => {
  try {
    const { studentId, templateCode, week, fypPart } = req.body;
    const currentFypPart = parseInt(fypPart || 1);

    console.log(`[UploadAttempt] Student: ${studentId}, Code: ${templateCode}, Part: ${currentFypPart}`);

    if (!studentId || !templateCode || !week) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Find student - support both string and numeric types
    const student = await User.findOne({
      $or: [
        { studentId: studentId },
        { studentId: String(studentId) },
        { email: studentId } // fallback for email
      ]
    });
    
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // Find group using helper which handles all members (leader, member2, member3)
    const { group } = await getStudentMetaData({ 
      sapId: student.studentId || studentId, 
      email: student.email 
    });
    
    if (!group) return res.status(400).json({ success: false, message: "No group assigned to this student." });

    const groupId = group._id;

    if (group.isArchived) {
      return res.status(400).json({ success: false, message: "This project is archived and read-only." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!ALLOWED_EXT[templateCode]?.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed: ${ALLOWED_EXT[templateCode].join(", ")}`,
      });
    }

    // ---------- FYP-2 CONTROL ----------
    if (currentFypPart === 2) {
      const fyp1Done = await isFyp1Completed(groupId);

      if (!fyp1Done) {
        console.log(`[UploadBlocked] Group ${groupId} tried FYP-2 but FYP-1 is incomplete.`);
        return res.status(400).json({
          success: false,
          message: "Complete and get approval (Approved status) of all 6 FYP-1 templates first.",
        });
      }

      // t06 requires t05 (FYP-2)
      if (templateCode === "t06") {
        const t05 = await StudentUploadedTemplate.findOne({
          groupId,
          templateCode: "t05",
          fypPart: 2,
          status: "Approved"
        });

        if (!t05) {
          return res.status(400).json({
            success: false,
            message: "Upload and get approval for FYP-2 Project Report (t05) first.",
          });
        }
      }
    }

    // ---------- FYP-1 SEQUENCE ----------
    if (currentFypPart === 1) {
      const sequence = ["t01", "t02", "t03", "t04", "t05", "t07"];
      const index = sequence.indexOf(templateCode);

      if (index > 0) {
        const prev = await StudentUploadedTemplate.findOne({
          groupId,
          templateCode: sequence[index - 1],
          fypPart: 1,
        });

        if (!prev) {
          return res.status(400).json({
            success: false,
            message: `Please upload ${sequence[index - 1]} first.`,
          });
        }
      }
    }

    // ---------- REUPLOAD ----------
    const existing = await StudentUploadedTemplate.findOne({
      groupId,
      templateCode,
      fypPart: currentFypPart,
    });

    if (existing) {
      if (fs.existsSync(existing.filePath)) {
        try { fs.unlinkSync(existing.filePath); } catch (e) { }
      }

      existing.filePath = req.file.path;
      existing.originalName = req.file.originalname;
      existing.status = "Under Review";
      existing.week = week;
      existing.uploadedAt = Date.now();

      await existing.save();
      return res.json({ success: true, data: existing });
    }

    // ---------- LABELS (Updated for synchronization) ----------
    let label = "";
    if (currentFypPart === 2) {
      if (templateCode === "t05") label = "Project Report (FYP-2)";
      else if (templateCode === "t06") label = "Complete Project Report (FYP-2)";
      else label = "Template " + templateCode;
    } else {
      const TEMPLATE_MAP = {
        t01: "Project Team List",
        t02: "Initial Proposal",
        t03: "Proposal Presentation (PPT)",
        t04: "Proposal & Plan",
        t05: "Project Report",
        t07: "Final Presentation (PPT)",
      };
      label = TEMPLATE_MAP[templateCode] || ("Template " + templateCode);
    }

    // ---------- SAVE ----------
    const newTemplate = await StudentUploadedTemplate.create({
      groupId,
      studentId,
      templateCode,
      templateLabel: label,
      week,
      fypPart: currentFypPart,
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

// ---------- GET TEMPLATES + STATUS ----------
exports.getGroupTemplates = async (req, res) => {
  try {
    const { groupId } = req.params;

    const templates = await StudentUploadedTemplate.find({ groupId });

    const fyp1Done = await isFyp1Completed(groupId);
    const fyp2Done = await isFyp2Completed(groupId);

    res.json({
      success: true,
      data: templates,
      meta: {
        fyp1Completed: fyp1Done,
        fyp2Completed: fyp2Done,
        projectCompleted: fyp1Done && fyp2Done,
      },
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// ---------- STUDENT INFO (Public/ID-based) ----------
exports.getStudentInfo = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findOne({
      $or: [
        { studentId: studentId },
        { studentId: String(studentId) },
        { _id: mongoose.Types.ObjectId.isValid(studentId) ? studentId : undefined }
      ]
    });

    if (!student) {
      return res.status(200).json({ success: false, message: "Student not found" });
    }

    const { group } = await getStudentMetaData({ sapId: student.studentId || studentId, email: student.email });
    if (!group) {
      return res.status(200).json({ 
        success: true, 
        data: { 
          department: student.department || "N/A",
          groupId: null,
          displayGroupId: "No Group",
          noGroup: true 
        } 
      });
    }

    res.json({
      success: true,
      data: {
        department: student.department,
        groupId: group._id,
        displayGroupId: group.groupId,
        isArchived: group.isArchived || false,
      },
    });

  } catch (err) {
    console.error("getStudentInfo Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------- AUTHENTICATED STUDENT INFO ----------
exports.getAuthenticatedStudentInfo = async (req, res) => {
  try {
    const user = req.user;
    const { group } = await getStudentMetaData({ email: user.email, sapId: user.studentId || user.sapId });

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found for this student" });
    }

    res.json({
      success: true,
      data: {
        department: user.department,
        groupId: group._id,
        displayGroupId: group.groupId,
        isArchived: group.isArchived || false,
        name: user.name,
        email: user.email,
        sapId: user.studentId || user.sapId
      },
    });
  } catch (err) {
    console.error("getAuthenticatedStudentInfo Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};