const mongoose = require("mongoose");

const meetingSlotSchema = new mongoose.Schema({
  supervisorEmail: { type: String, required: true },
  date: { type: String, required: true },  // YYYY-MM-DD
  time: { type: String, required: true },  // HH:mm
  duration: { type: Number, default: 30 },

  status: { type: Number, default: 0 },    // 0=available,1=booked,2=done
  bookedBy: { type: String, default: null },
  doneAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("MeetingSlot", meetingSlotSchema);
