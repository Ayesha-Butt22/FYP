// supervisorRoutes.js
const express = require('express');
const { protect, isSupervisor } = require('../middlewares/authMiddleware');
const supervisorController = require('../controllers/supervisorController');

const router = express.Router();

// ==========================================
// ROUTES
// ==========================================

// GET RECENT ACTIVITIES
router.get('/recent-activities', protect, isSupervisor, supervisorController.getRecentActivities);

// GET GROUPS (for milestones page)
router.get('/groups', protect, isSupervisor, supervisorController.getSupervisorGroups);

// 🆕 GET GROUPS WITH DETAILS (for groups page)
router.get('/my-groups', protect, isSupervisor, supervisorController.getSupervisorGroupsWithDetails);

// GET GROUP SUBMISSIONS
router.get('/group/:groupId/submissions', supervisorController.getGroupSubmission);

// UPDATE MILESTONE STATUS
router.put('/groups/:groupId/milestones/:code', supervisorController.SubmitGroupreview);

// Reports routes
router.get('/reports/groups', protect, isSupervisor, supervisorController.getSupervisorGroupsForReports);
router.get('/reports/group/:groupId', protect, isSupervisor, supervisorController.getGroupDetailedReport);
router.put('/reports/submission/:submissionId', protect, isSupervisor, supervisorController.updateSubmissionFeedback);

module.exports = router;