const mongoose = require("mongoose");

const NoticeboardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
    },

    audience: {
      type: String,
      enum: ["All", "Supervisor", "Coordinator", "Student"],
      default: "All",
    },

    department: {
      type: String,
      enum: ["All", "CS", "SE", "CA", "CyberSec"],
      default: "All",
    },

    postedBy: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Noticeboard", NoticeboardSchema);
