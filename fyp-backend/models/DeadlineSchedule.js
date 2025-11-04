const mongoose = require("mongoose");

const SlotSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentGroup",
    default: null,
  },
});

const DeadlineScheduleSchema = new mongoose.Schema({
  week: { type: String, required: true },
  fypPart: { type: String, required: true },
  facultyPanels: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  venue: { type: String, required: true },
  slots: [SlotSchema],
  durationMinutes: { type: Number, default: 45 }, // dynamic slot duration
  isPublish: { type: Boolean, default: false }, // ✅ publish flag
});

module.exports = mongoose.model("PresentationSchedule", DeadlineScheduleSchema);
