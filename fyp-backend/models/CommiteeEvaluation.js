
const mongoose = require("mongoose");
const StudentEvaluationSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    name: String,
    presentationMarks: Number,
    performanceMarks: Number,
});

const FacultyEvaluationSchema = new mongoose.Schema({
    comments: { type: String, default: null },
    evaluatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    students: [StudentEvaluationSchema],

    submittedAt: { type: Date, default: Date.now },
});

const GroupEvaluationSchema = new mongoose.Schema({
    scheduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PresentationSchedule",
        required: true,
    },
    slotId: { type: mongoose.Schema.Types.ObjectId, required: true },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
    },
    evaluations: [FacultyEvaluationSchema],
    isApprovedByCoordinator: { type: Boolean, default: false },
    approvedAt: Date,

}, { timestamps: true });

module.exports = mongoose.model("CommiteeEvaluation", GroupEvaluationSchema);