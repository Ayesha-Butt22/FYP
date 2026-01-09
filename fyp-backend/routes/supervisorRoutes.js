const express = require('express');
const { protect, isSupervisor } = require('../middlewares/authMiddleware');
const supervisorController = require('../controllers/supervisorController');

const router = express.Router();

// GET SUPERVISOR STATS
router.get('/stats', protect, isSupervisor, supervisorController.getSupervisorStats);

// GET RECENT ACTIVITIES
router.get('/recent-activities', protect, isSupervisor, supervisorController.getRecentActivities);

module.exports = router;