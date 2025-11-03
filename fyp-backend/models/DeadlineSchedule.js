const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Group", default: null },
});

const deadlineScheduleSchema = new mongoose.Schema({
    week: { type: String, required: true },
    fypPart: { type: String, enum: ["fyp-1", "fyp-2"], required: true },
    facultyPanels: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    venue: { type: String, required: true },
    slots: [slotSchema],
}, {
    timestamps: true
});

// ensure one schedule per week + fypPart + venue (if you want per-venue schedules).
// If you want unique by week+fypPart only, remove venue from index.
deadlineScheduleSchema.index({ week: 1, fypPart: 1, venue: 1 }, { unique: false });

module.exports = mongoose.model("DeadlineSchedule", deadlineScheduleSchema);