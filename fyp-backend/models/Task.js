//Task.jsx
const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  text: String,
  author: String,
  authorEmail: String,
  date: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
  title: String,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdByName: String,
  createdByEmail: String,
  createDate: { type: Date, default: Date.now },
  assignedToEmail: String,
  assignedToName: String,
  groupId: mongoose.Schema.Types.ObjectId,
  progress: { type: Number, default: 0, min: 0, max: 100 },
  status: { 
    type: String, 
    enum: ["Pending", "In Progress", "Completed"], 
    default: "Pending" 
  },
  comments: [CommentSchema]
});

module.exports = mongoose.model("Task", TaskSchema);