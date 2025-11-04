const PresentationSchedule = require("../models/DeadlineSchedule");
const User = require("../models/User");
const Group = require("../models/StudentGroup");
const mongoose = require("mongoose");

// ---------------- Helper functions ---------------- //
function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function normalizeSlot(slot) {
  return {
    startTime: new Date(slot.startTime),
    endTime: new Date(slot.endTime),
    bookedBy: slot.bookedBy ? mongoose.Types.ObjectId(slot.bookedBy) : null,
  };
}

async function validateFacultyIds(ids = []) {
  if (!Array.isArray(ids)) return false;
  if (ids.length === 0) return true;
  const count = await User.countDocuments({
    _id: { $in: ids },
    role: { $in: ["coordinator", "supervisor"] },
  });
  return count === ids.length;
}

// ---------------- CREATE OR UPDATE PRESENTATION BATCH ---------------- //
exports.createOrUpdatePresentationBatch = async (req, res) => {
  try {
    const { week, fypPart, panels = [], durationMinutes = 45 } = req.body;

    if (!week || !fypPart)
      return res.status(400).json({ success: false, message: "week and fypPart are required" });

    if (!Array.isArray(panels) || panels.length === 0)
      return res.status(400).json({ success: false, message: "panels array required" });

    const results = [];

    for (const panel of panels) {
      const { facultyPanels = [], venue, slots = [] } = panel;

      if (!(await validateFacultyIds(facultyPanels))) {
        return res.status(400).json({ success: false, message: "Invalid faculty IDs" });
      }

      const normalizedSlots = (slots || []).map(normalizeSlot);
      for (const s of normalizedSlots) {
        if (isNaN(s.startTime.getTime()) || isNaN(s.endTime.getTime()))
          return res.status(400).json({ success: false, message: "Invalid slot date/time" });
        if (s.startTime >= s.endTime)
          return res.status(400).json({ success: false, message: "Slot startTime must be before endTime" });
      }

      let schedule = await PresentationSchedule.findOne({ week, fypPart, venue });

      if (schedule) {
        // Update existing
        const existingFacultyIds = schedule.facultyPanels.map(f => f.toString());
        const newFaculty = facultyPanels.filter(id => !existingFacultyIds.includes(id.toString()));
        schedule.facultyPanels.push(...newFaculty);

        const existingSlots = schedule.slots.map(s => ({
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
        }));

        for (const ns of normalizedSlots) {
          for (const es of existingSlots) {
            if (intervalsOverlap(ns.startTime, ns.endTime, es.startTime, es.endTime)) {
              return res.status(400).json({ success: false, message: "Slot overlaps existing slot" });
            }
          }
        }

        const existingSlotKeys = new Set(
          schedule.slots.map(s => `${new Date(s.startTime).toISOString()}|${new Date(s.endTime).toISOString()}`)
        );

        const toAdd = normalizedSlots.filter(s => {
          const key = `${s.startTime.toISOString()}|${s.endTime.toISOString()}`;
          if (existingSlotKeys.has(key)) return false;
          existingSlotKeys.add(key);
          return true;
        }).map(s => ({ startTime: s.startTime, endTime: s.endTime }));

        if (toAdd.length) schedule.slots.push(...toAdd);
        schedule.durationMinutes = durationMinutes;
        await schedule.save();

        results.push({ action: "updated", schedule });
      } else {
        // Create new
        const newSchedule = await PresentationSchedule.create({
          week,
          fypPart,
          facultyPanels,
          venue,
          slots: normalizedSlots.map(s => ({
            startTime: s.startTime,
            endTime: s.endTime,
          })),
          durationMinutes,
          isPublish: false,
        });
        results.push({ action: "created", schedule: newSchedule });
      }
    }

    res.json({ success: true, message: "Batch processed", data: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------- PUBLISH FLAG UPDATE ---------------- //
exports.publishSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await PresentationSchedule.findById(id);
    if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found" });

    schedule.isPublish = true;
    await schedule.save();

    res.json({ success: true, message: "Schedule published", data: schedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------------- GET PRESENTATIONS (only published) ---------------- //
exports.getPresentation = async (req, res) => {
  try {
    const { week, fypPart } = req.query;

    const filter = {};
    if (week) filter.week = week;
    if (fypPart) filter.fypPart = fypPart;

    const schedules = await PresentationSchedule.find(filter)
      .populate("facultyPanels", "name email")
      .populate("slots.bookedBy","groupId");

    res.json({ success: true, data: schedules });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------- GET FACULTY ---------------- //
exports.getFaculty = async (req, res) => {
  try {
    const faculty = await User.find({ role: { $in: ["supervisor", "coordinator"] } }).select(
      "_id name email"
    );
    res.json({ success: true, data: faculty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------- BOOK SLOT ---------------- //
exports.bookSlot = async (req, res) => {
  try {
    const { slotId, groupId } = req.params;
    const schedule = await PresentationSchedule.findOne({ "slots._id": slotId });
    if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found" });

    const slot = schedule.slots.id(slotId);
    if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });

    if (slot.bookedBy) return res.status(400).json({ success: false, message: "Slot already booked" });

    slot.bookedBy = groupId;
    await schedule.save();

    res.json({ success: true, message: "Slot booked successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------- CHECK SLOT (only published schedules) ---------------- //
exports.checkSlot = async (req, res) => {
  try {
    const { email } = req.params;

    const group = await Group.findOne({
      $or: [
        { "leader.email": email },
        { "member2.email": email },
        { "member3.email": email },
      ],
    });

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // ✅ check in published only
    const booked = await PresentationSchedule.findOne({
      "slots.bookedBy": group._id,
      isPublish: true,
    });

    if (booked) {
      return res.json({ success: true, alreadyBooked: true, groupId: group._id, details: booked });
    }

    // ✅ find available published schedule
    const schedule = await PresentationSchedule.findOne({
      fypPart: "fyp-1",
      isPublish: true,
    });

    if (!schedule) {
      return res.json({ success: true, alreadyBooked: false, availableSlots: [] });
    }

    const availableSlots = schedule.slots.filter((slot) => !slot.bookedBy);

    return res.json({
      success: true,
      alreadyBooked: false,
      scheduleId: schedule._id,
      groupId: group._id,
      wholeData: schedule,
      availableSlots,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
