// routes/activityRoutes.js
const express = require("express");
const router = express.Router();
const { getRecentActivity } = require("../controllers/activityController");
const { protect } = require("../middlewares/authMiddleware");

// GET /api/activity/recent
router.get("/recent", protect, getRecentActivity);

module.exports = router;