const StudentUploadedTemplate = require("../models/StudentUploadedTemplate");
const User = require("../models/User"); // only once
const fs = require("fs");
const path = require("path");
const getStudentMetaData = require("./getStudentMetaData");
const Group = require("../models/StudentGroup"); // ✅ ADD THIS
const Proposal = require("../models/StudentProposal"); // ✅ ADD THIS

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
const TEMPLATE_SEQUENCE = ["t01","t02","t03","t04","t05","t06","t07","t08","t09"];

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

      const { group, proposal } = await getStudentMetaData({
          sapId: studentId
      });

         const  groupId = group._id;

      // const { groupId, department } = student;



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


      const TEMPLATE_MAP = {
          t01: "Project Team List (MS Word)",
          t02: "Initial Proposal (MS Word)",
          t03: "Proposal Presentation (MS PowerPoint)",
          t04: "Proposal & Plan (MS Word)",
          t05: "Progress Presentation (MS PowerPoint)",
          t06: "Complete Project Report (MS Word)",
          t07: "Final Presentation (MS PowerPoint)",
          t08: "Complete Final Presentation (MS Word)",
          t09: "Complete Documentation (MS Word)",
      };

      const templateLabel = TEMPLATE_MAP[templateCode];



    // Save new template
    const newTemplate = await StudentUploadedTemplate.create({
      groupId,
      studentId,
      templateCode,
      templateLabel: templateLabel,
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

// ==========================================
// 🆕 FEEDBACK FUNCTIONS - PASTE BELOW
// ==========================================

/**
 * Get student's feedback from supervisor
 */
exports.getStudentFeedback = async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log('🔍 Fetching feedback for student:', studentId);

    // Step 1: Find student's group
    const group = await Group.findOne({
      $or: [
        { "leader.sapId": studentId },
        { "member2.sapId": studentId },
        { "member3.sapId": studentId },
      ],
    }).lean();

    if (!group) {
      return res.json({
        success: true,
        feedbacks: [],
        message: 'Student has no group yet'
      });
    }

    // Step 2: Get proposal for project title
    const proposal = await Proposal.findOne({ groupId: group._id }).lean();

    // Step 3: Get all submissions with supervisor feedback
    const submissions = await StudentUploadedTemplate.find({
      groupId: group._id,
      supervisorRemarks: { $exists: true, $ne: "" } // Only submissions with feedback
    })
    .sort({ uploadedAt: -1 })
    .lean();

    if (!submissions || submissions.length === 0) {
      return res.json({
        success: true,
        feedbacks: [],
        message: 'No feedback received yet'
      });
    }

    // Step 4: Format feedback data
    const feedbacks = submissions.map(sub => ({
      project: proposal?.projectTitle || group.groupId || 'Project',
      projectId: group.groupId,
      milestone: sub.templateLabel || `Template ${sub.templateCode}`,
      templateCode: sub.templateCode,
      feedback: sub.supervisorRemarks || '',
      evaluatedOn: sub.updatedAt || sub.uploadedAt, // When feedback was added
      status: sub.status,
      week: sub.week
    }));

    console.log('✅ Returning', feedbacks.length, 'feedbacks');

    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks: feedbacks
    });

  } catch (error) {
    console.error('❌ Error fetching student feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};

/**
 * Get student's feedback by email (alternative method)
 */
exports.getStudentFeedbackByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    console.log('🔍 Fetching feedback for email:', email);

    // Find student's group by email
    const group = await Group.findOne({
      $or: [
        { "leader.email": email },
        { "member2.email": email },
        { "member3.email": email },
      ],
    }).lean();

    if (!group) {
      return res.json({
        success: true,
        feedbacks: [],
        message: 'Student has no group yet'
      });
    }

    // Get proposal
    const proposal = await Proposal.findOne({ groupId: group._id }).lean();

    // Get submissions with feedback
    const submissions = await StudentUploadedTemplate.find({
      groupId: group._id,
      supervisorRemarks: { $exists: true, $ne: "" }
    })
    .sort({ updatedAt: -1 })
    .lean();

    const feedbacks = submissions.map(sub => ({
      project: proposal?.projectTitle || group.groupId || 'Project',
      projectId: group.groupId,
      milestone: sub.templateLabel || `Template ${sub.templateCode}`,
      templateCode: sub.templateCode,
      feedback: sub.supervisorRemarks || '',
      evaluatedOn: sub.updatedAt || sub.uploadedAt,
      status: sub.status,
      week: sub.week
    }));

    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks: feedbacks
    });

  } catch (error) {
    console.error('Error fetching student feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};