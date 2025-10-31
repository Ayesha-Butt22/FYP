//models/StudentGroup.js
const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  groupId: { type: String, required: true, unique: true },
  leader: {
    sapId: { type: String, required: true },
    email: { type: String, required: true }
  },
  member2: {
    sapId: { type: String },
    email: { type: String }
  },
  member3: {
    sapId: { type: String },
    email: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model("Group", groupSchema);