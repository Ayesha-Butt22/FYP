const mongoose = require("mongoose");

const archiveProjectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    technologies: { type: [String], default: [] },
    archivedAt: { type: Date, default: Date.now },
    supervisor: { type: String, default: "" },
});

module.exports = mongoose.model("ArchiveProject", archiveProjectSchema);
