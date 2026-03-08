const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    action:      { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["supervisor", "coordinator", "student", "admin", "template", "deadline"],
      required: true,
    },
    performedBy: { type: String, default: "system" },
    meta:        { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);