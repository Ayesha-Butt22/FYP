const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: null },
});

const deadlineScheduleSchema = new mongoose.Schema({
    week: { type: String, required: true },
    fypPart: { type: String, enum: ["fyp-1", "fyp-2"], required: true },
    facultyPanels: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    venue: { type: String, required: true },
    slots: [slotSchema],
});

module.exports = mongoose.model("DeadlineSchedule", deadlineScheduleSchema);

