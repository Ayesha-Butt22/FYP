const PresentationSchedule = require("../models/DeadlineSchedule");
const User = require("../models/User");
const Group = require("../models/StudentGroup");
const mongoose = require("mongoose");

/**
 * Helpers
 */
function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function normalizeSlot(slot) {
  // Accept slot.startTime / endTime as Date or ISO-string; convert to Date objects
  return {
    startTime: new Date(slot.startTime),
    endTime: new Date(slot.endTime),
    bookedBy: slot.bookedBy ? mongoose.Types.ObjectId(slot.bookedBy) : null,
  };
}

async function validateFacultyIds(ids = []) {
  if (!Array.isArray(ids)) return false;
  if (ids.length === 0) return true;
  const count = await User.countDocuments({ _id: { $in: ids }, role: { $in: ["coordinator", "supervisor"] } });
  return count === ids.length;
}

/**
 * Create or update a single schedule (existing logic improved)
 * - Accepts slot array where startTime/endTime are ISO strings or Date-compatible
 * - Validates slots (start < end, no overlap with existing schedule slots)
 */
exports.createOrUpdatePresentation = async (req, res) => {
  try {
    const { week, fypPart, facultyPanels = [], venue, slots = [] } = req.body;

    if (!week || !fypPart) return res.status(400).json({ success: false, message: "week and fypPart are required" });

    // Validate faculty ids exist
    if (!await validateFacultyIds(facultyPanels)) {
      return res.status(400).json({ success: false, message: "One or more faculty ids are invalid" });
    }

    // Normalize slots
    const normalizedSlots = (slots || []).map(normalizeSlot);

    // Validate slot times
    for (const s of normalizedSlots) {
      if (isNaN(s.startTime.getTime()) || isNaN(s.endTime.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid slot date/time" });
      }
      if (s.startTime >= s.endTime) {
        return res.status(400).json({ success: false, message: "Slot startTime must be before endTime" });
      }
    }

    let schedule = await PresentationSchedule.findOne({ week, fypPart });

    if (schedule) {
      // add faculty panels (unique)
      const existingFacultyIds = schedule.facultyPanels.map(f => f.toString());
      const newFaculty = facultyPanels.filter(id => !existingFacultyIds.includes(id.toString()));
      if (newFaculty.length) schedule.facultyPanels.push(...newFaculty);

      // existing slots list for overlap checking
      const existingSlots = schedule.slots.map(s => ({
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
      }));

      // Check overlaps: new slots should not overlap existing slots
      for (const ns of normalizedSlots) {
        for (const es of existingSlots) {
          if (intervalsOverlap(ns.startTime, ns.endTime, es.startTime, es.endTime)) {
            return res.status(400).json({
              success: false,
              message: `New slot ${ns.startTime.toISOString()}-${ns.endTime.toISOString()} overlaps existing slot ${es.startTime.toISOString()}-${es.endTime.toISOString()}`,
            });
          }
        }
      }

      // deduplicate exact same slot (use ISO)
      const existingSlotKeys = new Set(schedule.slots.map(
        s => `${new Date(s.startTime).toISOString()}|${new Date(s.endTime).toISOString()}`
      ));
      const toAdd = normalizedSlots.filter(s => {
        const key = `${s.startTime.toISOString()}|${s.endTime.toISOString()}`;
        if (existingSlotKeys.has(key)) return false;
        existingSlotKeys.add(key);
        return true;
      }).map(s => ({ startTime: s.startTime, endTime: s.endTime }));

      if (toAdd.length) schedule.slots.push(...toAdd);

      if (venue) schedule.venue = venue;
      await schedule.save();
      return res.json({ success: true, message: "Schedule updated", data: schedule });
    }

    // if schedule not found, create new one
    const newSchedule = await PresentationSchedule.create({
      week,
      fypPart,
      facultyPanels,
      venue,
      slots: normalizedSlots.map(s => ({ startTime: s.startTime, endTime: s.endTime })),
    });

    res.json({ success: true, message: "Schedule created", data: newSchedule });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Batch create or update — accept panels array and iterate
 * Payload example:
 * {
 *   week,
 *   fypPart,
 *   panels: [
 *     { facultyPanels: [...], venue: "Room A", slots: [{startTime, endTime}, ...] },
 *     { facultyPanels: [...], venue: "Room B", slots: [...] }
 *   ]
 * }
 */
exports.createOrUpdatePresentationBatch = async (req, res) => {
  try {
    const { week, fypPart, panels = [] } = req.body;
    if (!week || !fypPart) return res.status(400).json({ success: false, message: "week and fypPart are required" });
    if (!Array.isArray(panels) || panels.length === 0) return res.status(400).json({ success: false, message: "panels array required" });

    const results = [];
    for (const panel of panels) {
      const { facultyPanels = [], venue, slots = [] } = panel;

      // Validate faculty
      if (!await validateFacultyIds(facultyPanels)) {
        return res.status(400).json({ success: false, message: "One or more faculty ids are invalid in panel", panel });
      }

      const normalizedSlots = (slots || []).map(normalizeSlot);
      for (const s of normalizedSlots) {
        if (isNaN(s.startTime.getTime()) || isNaN(s.endTime.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid slot date/time", panel });
        }
        if (s.startTime >= s.endTime) {
          return res.status(400).json({ success: false, message: "Slot startTime must be before endTime", panel });
        }
      }

      // Reuse existing createOrUpdate logic but per-panel
      let schedule = await PresentationSchedule.findOne({ week, fypPart, venue });

      if (schedule) {
        // add faculties unique
        const existingFacultyIds = schedule.facultyPanels.map(f => f.toString());
        const newFaculty = facultyPanels.filter(id => !existingFacultyIds.includes(id.toString()));
        schedule.facultyPanels.push(...newFaculty);

        // check overlaps against existing slots
        const existingSlots = schedule.slots.map(s => ({ startTime: new Date(s.startTime), endTime: new Date(s.endTime) }));
        for (const ns of normalizedSlots) {
          for (const es of existingSlots) {
            if (intervalsOverlap(ns.startTime, ns.endTime, es.startTime, es.endTime)) {
              return res.status(400).json({
                success: false,
                message: `New slot ${ns.startTime.toISOString()}-${ns.endTime.toISOString()} overlaps existing slot ${es.startTime.toISOString()}-${es.endTime.toISOString()}`,
                panel,
              });
            }
          }
        }

        const existingSlotKeys = new Set(schedule.slots.map(s => `${new Date(s.startTime).toISOString()}|${new Date(s.endTime).toISOString()}`));
        const toAdd = normalizedSlots.filter(s => {
          const key = `${s.startTime.toISOString()}|${s.endTime.toISOString()}`;
          if (existingSlotKeys.has(key)) return false;
          existingSlotKeys.add(key);
          return true;
        }).map(s => ({ startTime: s.startTime, endTime: s.endTime }));

        if (toAdd.length) schedule.slots.push(...toAdd);
        if (venue) schedule.venue = venue;
        await schedule.save();
        results.push({ action: "updated", schedule });
      } else {
        const newSchedule = await PresentationSchedule.create({
          week,
          fypPart,
          facultyPanels,
          venue,
          slots: normalizedSlots.map(s => ({ startTime: s.startTime, endTime: s.endTime })),
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


exports.getPresentation = async (req, res) => {
  try {
    const { week, fypPart } = req.query;

    // Build query: always require week, optionally filter by fypPart
    const query = {};
    if (week) query.week = week;
    if (fypPart) query.fypPart = fypPart;

    // Find all schedules matching the query
    const schedules = await PresentationSchedule.find(query)
      .populate("facultyPanels", "name email")
      .populate("slots.bookedBy", "groupId");

    // Return array (possibly empty)
    return res.json({ success: true, data: schedules });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Atomic booking: use findOneAndUpdate to avoid race conditions
 * Request body: { scheduleId, slotId, groupId }
 */
exports.bookSlot = async (req, res) => {
  try {
    const { slotId, groupId, scheduleId } = req.body;

    if (!scheduleId || !slotId || !groupId) return res.status(400).json({ success: false, message: "scheduleId, slotId and groupId are required" });

    // atomic update only if slot.bookedBy is null
    const query = {
      _id: scheduleId,
      "slots._id": slotId,
      "slots.bookedBy": { $exists: false } // treat missing as available
    };

    // If bookedBy is set as null explicitly in documents, use "slots.bookedBy": null

    const update = {
      $set: { "slots.$.bookedBy": groupId }
    };

    // Try update
    const updated = await PresentationSchedule.findOneAndUpdate(query, update, { new: true });

    if (!updated) {
      // find reason
      const schedule = await PresentationSchedule.findById(scheduleId);
      if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found" });
      const slot = schedule.slots.id(slotId);
      if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });
      if (slot.bookedBy) return res.status(409).json({ success: false, message: "Slot already booked" });
      return res.status(400).json({ success: false, message: "Unable to book slot" });
    }

    return res.json({ success: true, message: "Slot booked successfully", data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getFaculty = async (req , res) => {
  try {
    const list = await User.find({
      role: { $in: ['coordinator', 'supervisor'] }
    }).select('-password');

    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

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

    const booked = await PresentationSchedule.findOne({
      "slots.bookedBy": group._id,
    });

    if (booked) {
      return res.json({ success: true, alreadyBooked: true, groupId: group._id , details: booked  });
    }
    const schedule = await PresentationSchedule.findOne({ fypPart: "fyp-1" });

    if (!schedule) {
      return res.json({ success: true, alreadyBooked: false, availableSlots: [] });
    }

    const availableSlots = schedule.slots.filter((slot) => !slot.bookedBy);

    return res.json({
      success: true,
      alreadyBooked: false,
      scheduleId: schedule._id,
      groupId:group._id,
      wholeData :schedule,
      availableSlots,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};