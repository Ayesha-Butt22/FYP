const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const studentTemplateController = require("../controllers/studentTemplateController");
const { protect, isStudent } = require("../middlewares/authMiddleware");

// ---------------- SETUP MULTER ----------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/student-templates/");
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ---------------- ROUTES ----------------

// Upload a template
router.post("/upload", upload.single("file"), studentTemplateController.uploadTemplate);

// Get authenticated student info (Recommended)
router.get("/me", protect, isStudent, studentTemplateController.getAuthenticatedStudentInfo);

router.get("/students/:studentId", studentTemplateController.getStudentInfo);

// Get all templates for a group
router.get("/group/:groupId", studentTemplateController.getGroupTemplates);

// Get student info by studentId

module.exports = router;
