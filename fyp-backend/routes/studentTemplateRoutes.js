const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const studentTemplateController = require("../controllers/studentTemplateController");
const { protect, isCoordinator } = require("../middlewares/authMiddleware");

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

// Upload a template (student uploads — no coordinator check needed)
router.post("/upload", upload.single("file"), studentTemplateController.uploadTemplate);

// Get student info
router.get("/students/:studentId", studentTemplateController.getStudentInfo);

// Get all templates for a group (coordinator only)
router.get("/group/:groupId", protect, isCoordinator, studentTemplateController.getGroupTemplates);

module.exports = router;
