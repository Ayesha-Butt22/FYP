//routes//student.js
const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const studentController = require("../controllers/studentController");

const router = express.Router();


router.get("/supervisors/:spec", studentController.getAvailableSupervisors);
router.get("/stats", protect, studentController.getStudentStats);
router.get("/recent-activities", protect, studentController.getRecentActivities);

module.exports = router;
