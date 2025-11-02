const mongoose = require("mongoose");

const SupervisorWhiteboardSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  supervisorEmail: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SupervisorWhiteboard", SupervisorWhiteboardSchema);
