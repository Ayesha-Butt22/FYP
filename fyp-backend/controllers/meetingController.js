const MeetingSlot = require("../models/MeetingSlot");
const getStudentMetaData = require("./getStudentMetaData");


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
   const { group, proposal } = await getStudentMetaData({
      email: req.params.email
    });

  try {
    const slots = await MeetingSlot.find({
      supervisorEmail: proposal.projectSupervisor,
      status: 0
    }).sort({ date: 1, time: 1 });

    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ================= BOOK SLOT (STUDENT) ================= */

/* ================= BOOK SLOT (STUDENT EMAIL BASED → GROUP) ================= */
exports.bookSlot = async (req, res) => {
  try {
    const { slotId, studentEmail } = req.body;

    if (!slotId || !studentEmail) {
      return res.status(400).json({
        success: false,
        message: "slotId and studentEmail are required"
      });
    }

    /* =========================
       STEP 1: CHECK SLOT
    ========================= */
    const slot = await MeetingSlot.findOne({
      _id: slotId,
      status: 0
    });

    if (!slot) {
      return res.status(400).json({
        success: false,
        message: "Slot not available"
      });
    }

    /* =========================
       STEP 2: GET STUDENT META
    ========================= */
    const { group, proposal } = await getStudentMetaData({
      email: studentEmail
    });

    /* =========================
       STEP 3: VALIDATIONS
    ========================= */
    if (!group) {
      return res.status(403).json({
        success: false,
        message: "Student ka koi group registered nahi hai"
      });
    }

    if (!proposal) {
      return res.status(403).json({
        success: false,
        message: "Group ki proposal submit nahi hui"
      });
    }

    /* =========================
       STEP 4: BOOK SLOT (GROUP)
    ========================= */
    slot.status = 1;                 // booked
    slot.bookedBy = group._id;       // ✅ GROUP ID
    await slot.save();

    /* =========================
       SUCCESS RESPONSE
    ========================= */
    res.json({
      success: true,
      message: "Meeting booked successfully",
      data: {
        slotId: slot._id,
        groupId: group._id,
        proposalId: proposal._id
      }
    });

  } catch (err) {
    console.error("Book slot error:", err.message);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};
/* ================= GET STUDENT MEETINGS ================= */
/* ================= GET STUDENT MEETINGS (EMAIL → GROUP) ================= */
exports.getStudentMeetings = async (req, res) => {
  try {
    const studentEmail = req.params.email;

    /* =========================
       STEP 1: GET STUDENT META
    ========================= */
    const { group } = await getStudentMetaData({
      email: studentEmail
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Student ka koi group registered nahi hai"
      });
    }

    /* =========================
       STEP 2: FETCH GROUP MEETINGS
    ========================= */
    const meetings = await MeetingSlot.find({
      bookedBy: group._id,
      status: { $in: [1, 2] }
    }).sort({ date: -1 });

    res.json({
      success: true,
      meetings
    });

  } catch (err) {
    console.error("Get student meetings error:", err.message);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

/* ================= MARK DONE ================= */
exports.markDone = async (req, res) => {
  try {
    const slot = await MeetingSlot.findById(req.body.slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found" });
    }

    // Combine date + time
    const meetingDateTime = new Date(`${slot.date}T${slot.time}`);
    const now = new Date();

    if (now < meetingDateTime) {
      return res.status(400).json({
        success: false,
        message: "Meeting time has not passed yet"
      });
    }

    slot.status = 2; // done
    slot.doneAt = new Date();
    await slot.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

