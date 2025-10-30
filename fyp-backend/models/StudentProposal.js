const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
  projectTitle: { type: String, required: true },
  projectDescription: { type: String, required: true },
  projectTools: { type: String },
  projectSupervisor: { type: String },
  projectSpecialization: { type: String },
  projectSupervisorComments: { type: String },
  projectStatus: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Proposal", proposalSchema);
