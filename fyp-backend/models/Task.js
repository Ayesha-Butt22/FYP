// models/Task.js (if you need to update it)
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    email: { type: String, required: true },
    name: { type: String, required: true },
    sapId: { type: String }
  },
  date: {
    type: String,
    required: true
  }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ""
  },
  createdBy: {
    email: { type: String, required: true },
    name: { type: String, required: true },
    sapId: { type: String }
  },
  groupId: {
    type: String,
    required: true,
    ref: "Group"
  },
  assignedTo: {
    email: { type: String, required: true },
    name: { type: String, required: true },
    sapId: { type: String }
  },
  progress: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "On Hold"],
    default: "Pending"
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium"
  },
  dueDate: {
    type: Date
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadedBy: String,
    uploadedAt: Date
  }],
  comments: [commentSchema],
  history: [{
    action: String,
    details: String,
    changedBy: {
      email: String,
      name: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Auto-update status based on progress
taskSchema.pre("save", function(next) {
  if (this.progress === 100) {
    this.status = "Completed";
  } else if (this.progress > 0) {
    this.status = "In Progress";
  } else {
    this.status = "Pending";
  }
  next();
});

module.exports = mongoose.model("Task", taskSchema);