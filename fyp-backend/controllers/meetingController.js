const MeetingSlot = require("../models/MeetingSlot");

/* ================= CREATE SLOT ================= */
exports.createSlot = async (req, res) => {
  try {
    const slot = await MeetingSlot.create(req.body);
    res.json({ success: true, slot });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ================= GET SUPERVISOR MEETINGS ================= */
exports.getSupervisorMeetings = async (req, res) => {
  try {
    const email = req.params.email;
    const today = new Date().toISOString().split("T")[0];

    const all = await MeetingSlot.find({ supervisorEmail: email });

    // FUTURE SLOTS = status not done AND date today or later
    const futureSlots = all.filter(s => s.status !== 2 && s.date >= today);

    // UPCOMING = booked slots today or later
    const todayMeetings = all.filter(s => s.status === 1 && s.date >= today);

    // HISTORY = done OR past dates
    const history = all.filter(s => s.status === 2 || s.date < today);

    res.json({
      success: true,
      futureSlots,
      todayMeetings,
      history
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ================= GET AVAILABLE SLOTS FOR STUDENT ================= */
exports.getAvailableSlots = async (req, res) => {
  try {
    const slots = await MeetingSlot.find({
      supervisorEmail: req.params.email,
      status: 0
    }).sort({ date: 1, time: 1 });

    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ================= BOOK SLOT (STUDENT) ================= */
exports.bookSlot = async (req, res) => {
  try {
    const { slotId, studentEmail } = req.body;
    const slot = await MeetingSlot.findOne({ _id: slotId, status: 0 });

    if (!slot) return res.status(400).json({ success: false, message: "Slot not available" });

    slot.status = 1;
    slot.bookedBy = studentEmail;
    await slot.save();

    res.json({ success: true, slot });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ================= GET STUDENT MEETINGS ================= */
exports.getStudentMeetings = async (req, res) => {
  try {
    const meetings = await MeetingSlot.find({
      bookedBy: req.params.email,
      status: { $in: [1, 2] }
    }).sort({ date: -1 });

    res.json({ success: true, meetings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ================= MARK DONE ================= */
exports.markDone = async (req, res) => {
  try {
    await MeetingSlot.findByIdAndUpdate(req.body.slotId, {
      status: 2,
      doneAt: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
