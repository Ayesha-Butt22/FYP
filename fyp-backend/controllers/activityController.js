const ActivityLog = require("../models/ActivityLog");

// GET /api/activity/recent — Coordinator ki apni activities
const getRecentActivity = async (req, res) => {
  try {
    const performedBy = req.user?.email;

    const logs = await ActivityLog.find({
      category:    { $in: ["template", "deadline", "supervisor"] },
      performedBy: performedBy,
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error("getRecentActivity error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/activity/log — Frontend se activity save karo
const logActivityRoute = async (req, res) => {
  try {
    const { action, description, category } = req.body;
    const performedBy = req.user?.email;

    if (!action || !description || !category) {
      return res.status(400).json({ success: false, error: "action, description, category required" });
    }

    await ActivityLog.create({ action, description, category, performedBy });
    return res.json({ success: true });
  } catch (err) {
    console.error("logActivityRoute error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Reusable helper — doosre controllers mein use karo
const logActivity = async (action, description, category, performedBy = "system", meta = {}) => {
  try {
    await ActivityLog.create({ action, description, category, performedBy, meta });
  } catch (err) {
    console.error("logActivity error (non-fatal):", err.message);
  }
};

module.exports = { getRecentActivity, logActivityRoute, logActivity };