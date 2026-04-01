const MeetingSlot = require("../models/MeetingSlot");
const Group = require("../models/StudentGroup");
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

    // Fetch all slots
    const all = await MeetingSlot.find({ supervisorEmail: email }).lean();

    // Map booked slots to include Group readable ID if available
    const allWithGroups = await Promise.all(all.map(async (slot) => {
      if (slot.bookedBy) {
        const group = await Group.findById(slot.bookedBy).select("groupId leader.name");
        if (group) {
          return {
            ...slot,
            groupInfo: {
              readableId: group.groupId,
              leaderName: group.leader?.name
            }
          };
        }
      }
      return slot;
    }));

    const futureSlots = allWithGroups.filter(s => s.status !== 2 && s.date >= today);

    // Booked slots today or later
    const upcomingMeetings = allWithGroups.filter(s => s.status === 1 && s.date >= today);

    // History: marked done OR past dates
    const history = allWithGroups.filter(s => s.status === 2 || s.date < today);

    res.json({
      success: true,
      futureSlots,
      todayMeetings: upcomingMeetings,
      history
    });
  } catch (err) {
    console.error("getSupervisorMeetings error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ================= GET AVAILABLE SLOTS FOR STUDENT ================= */
exports.getAvailableSlots = async (req, res) => {
  try {
    const { group, proposal } = await getStudentMetaData({
      email: req.params.email
    });

    if (!proposal || !proposal.projectSupervisor) {
      return res.json({ 
        success: true, 
        slots: [], 
        message: "No supervisor assigned yet or proposal not found." 
      });
    }

    const slots = await MeetingSlot.find({
      supervisorEmail: proposal.projectSupervisor,
      status: 0
    }).sort({ date: 1, time: 1 });

    res.json({ success: true, slots });
  } catch (err) {
    console.error("Get available slots error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

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

    const { group, proposal } = await getStudentMetaData({
      email: studentEmail
    });

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

    slot.status = 1;                 // booked
    slot.bookedBy = group._id.toString(); // ✅ GROUP ID as string
    await slot.save();

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

/* ================= GET STUDENT MEETINGS (EMAIL → GROUP) ================= */
exports.getStudentMeetings = async (req, res) => {
  try {
    const studentEmail = req.params.email;
    const { group } = await getStudentMetaData({
      email: studentEmail
    });

    if (!group) {
      return res.json({
        success: true,
        meetings: [],
        message: "Student ka koi group registered nahi hai"
      });
    }

    const meetings = await MeetingSlot.find({
      bookedBy: group._id.toString(),
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
    console.log("markDone Debug - Headers:", req.headers);
    console.log("markDone Debug - Body:", req.body);
    console.log("markDone Debug - Query:", req.query);
    
    const slotId = req.body?.slotId || req.query?.slotId;
    if (!slotId) {
      console.error("markDone Error: slotId is missing in body and query");
      return res.status(400).json({ 
        success: false, 
        message: "slotId is required",
        receivedBody: req.body,
        receivedQuery: req.query
      });
    }

    const slot = await MeetingSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found" });
    }

    // Removing strict time check to allow marking done early if meeting finishes early
    slot.status = 2; // done
    slot.doneAt = new Date();
    await slot.save();

    res.json({ success: true, message: "Meeting marked as done" });
  } catch (err) {
    console.error("markDone error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

