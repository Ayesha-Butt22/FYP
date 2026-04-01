const mongoose = require("mongoose");

const supervisorEvaluationSchema = new mongoose.Schema({
    // Store display groupId (string) so frontend queries work without ObjectId cast
    groupId: { type: String, required: true },
    fypYear: { type: String, enum: ["fyp1", "fyp2", "fyp-1", "fyp-2"], required: true },
    evaluations: [{
        studentName: String,
        name: String,
        marks: Number,
        maxMarks: Number,
        feedback: { type: String, default: "" }
    }],
    totalMarks: Number,
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("SupervisorEvaluation", supervisorEvaluationSchema);
