const mongoose = require("mongoose");

const STATUS_ENUM = ["Pending", "Under Review", "Approved", "Rejected"];

const StudentUploadedTemplateSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentGroup", required: true },
  studentId: { type: String, required: false },
  templateCode: { type: String, required: true },
  templateLabel: { type: String, required: true },
  week: { type: Number, enum: [1,2,4,6,13,24,26, 28,30], required: true },
  filePath: { type: String, required: true },
  originalName: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  supervisorRemarks: { type: String, default: "" },
  status: { type: String, enum: STATUS_ENUM, default: "Pending" },
});

module.exports = mongoose.model("StudentUploadedTemplate", StudentUploadedTemplateSchema);
