// supervisorRoutes.js
const express = require('express');
const { protect, isSupervisor } = require('../middlewares/authMiddleware');
const supervisorController = require('../controllers/supervisorController');

const router = express.Router();
router.get("/ping", (req, res) => res.json({ success: true, message: "pong" }));

// GET SUPERVISOR STATS
router.get('/stats', protect, supervisorController.getSupervisorStats);

// ARCHIVE GROUP (Added here to ensure priority)
router.post("/archive-group", protect, isSupervisor, (req, res, next) => {
    console.log("Archive route hit!");
    next();
}, supervisorController.archiveGroup);

// GET RECENT ACTIVITIES
router.get('/recent-activities', protect, supervisorController.getRecentActivities);


router.get(
  "/groups",
  protect,
  isSupervisor,
  supervisorController.getSupervisorGroups
);

router.get("/group/:groupId/submissions" , supervisorController.getGroupSubmission);
router.put("/groups/:groupId/milestones/:code" , supervisorController.SubmitGroupreview);

// EVALUATIONS
router.post("/evaluations/submit", protect, isSupervisor, supervisorController.submitSupervisorEvaluation);
router.get("/evaluations/:groupId", protect, isSupervisor, supervisorController.getSupervisorEvaluations);
router.get("/student-evaluations/:email", protect, supervisorController.getStudentSupervisorEvaluations);


module.exports = router;