const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const coordinatorController = require("../controllers/coordinatorController");

const router = express.Router();

router.get("/stats", protect, coordinatorController.getCoordinatorStats);
router.get("/recent-activities", protect, coordinatorController.getRecentActivities);
router.get("/final-results", protect, coordinatorController.getFinalResults);

module.exports = router;
