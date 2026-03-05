// controllers/activityController.js
const ActivityLog = require("../models/ActivityLog");

const getRecentActivity = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error("getRecentActivity error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const logActivity = async (action, description, category, performedBy = "system", meta = {}) => {
  try {
    await ActivityLog.create({ action, description, category, performedBy, meta });
  } catch (err) {
    console.error("logActivity error (non-fatal):", err.message);
  }
};

module.exports = { getRecentActivity, logActivity };