const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const { getRecentActivity, logActivityRoute } = require("../controllers/activityController");

const router = express.Router();

router.get("/recent", protect, getRecentActivity);
router.post("/log",   protect, logActivityRoute);

module.exports = router;