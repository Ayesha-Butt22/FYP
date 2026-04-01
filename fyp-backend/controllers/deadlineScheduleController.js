const PresentationSchedule = require("../models/DeadlineSchedule");
const User = require("../models/User");
const Group = require("../models/StudentGroup");
const mongoose = require("mongoose");
const CommitteeEvaluation = require("../models/CommitteeEvaluation");

function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function normalizeSlot(slot) {
  return {
    startTime: new Date(slot.startTime),
    endTime: new Date(slot.endTime),
    bookedBy: slot.bookedBy ? new mongoose.Types.ObjectId(slot.bookedBy) : null,
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
        schedule.isPublish = false; // Reset publish status whenever a schedule is modified/updated
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


exports.getPresentation = async (req, res) => {
  try {
    const { week, fypPart } = req.query;

    const filter = {};
    if (week) filter.week = week;
    if (fypPart) filter.fypPart = fypPart;

    const schedules = await PresentationSchedule.find(filter)
      .populate("facultyPanels", "name email")
      .populate("slots.bookedBy", "groupId leader")
      .lean();

    // Collect all leader emails from booked slots
    const emails = [];
    schedules.forEach(sched => {
      (sched.slots || []).forEach(slot => {
        if (slot.bookedBy?.leader?.email) {
          emails.push(slot.bookedBy.leader.email);
        }
      });
    });

    // Fetch user names
    const users = await User.find({ email: { $in: emails } }).select("email name");
    const emailNameMap = {};
    users.forEach(u => { emailNameMap[u.email] = u.name; });

    // Map names back into the schedules
    schedules.forEach(sched => {
      (sched.slots || []).forEach(slot => {
        if (slot.bookedBy?.leader?.email) {
          slot.bookedBy.leader.name = emailNameMap[slot.bookedBy.leader.email] || "Unknown";
        }
      });
    });

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
    const { slotId, groupId, selectedSlot } = req.body;
    const targetSlotId = selectedSlot || slotId;

    const schedule = await PresentationSchedule.findOne({ "slots._id": targetSlotId });
    if (!schedule) return res.status(404).json({ success: false, message: "Schedule not found" });

    const slot = schedule.slots.id(targetSlotId);
    if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });

    // ── Check if group is archived ──
    const groupCheck = await Group.findById(groupId);
    if (groupCheck?.isArchived) {
      return res.status(400).json({ success: false, message: "Archived groups cannot book presentation slots." });
    }

    if (slot.bookedBy) return res.status(400).json({ success: false, message: "Slot already booked by another group" });

    // ── Prevent same group booking multiple times in the same milestone ──
    // Check ALL schedules (including this one) for the same week + fypPart
    const existingInMilestone = await PresentationSchedule.findOne({
      week: schedule.week,
      fypPart: schedule.fypPart,
      "slots.bookedBy": groupId,
    });

    if (existingInMilestone) {
      return res.status(400).json({
        success: false,
        message: `Your group already has a slot booked for ${schedule.week}${existingInMilestone.venue ? " at venue " + existingInMilestone.venue : ""}. You cannot book more than one slot per milestone.`,
      });
    }

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
    const { email: studentEmail } = req.params;

    // ── 1. Find the group this student belongs to ─────────────────────────
    // The Group model has leader.email, member2.email, member3.email
    const group = await Group.findOne({
      $or: [
        { "leader.email": studentEmail },
        { "member2.email": studentEmail },
        { "member3.email": studentEmail },
      ]
    });

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found for this student" });
    }

    // ── If group is archived, return immediately ──
    if (group.isArchived) {
      return res.json({
        success: true,
        status: "archived",
        isArchived: true,
        message: "Your project has been archived. No further activity is required.",
        availableSlots: []
      });
    }

    // Helper for robust string matching
    const norm = (s) => (s || "").toString().toLowerCase().replace(/[\s-]/g, "");
    // ── 1. Load all committee evaluations for this group ──────────────────
    const allEvaluations = await CommitteeEvaluation.find({ groupId: group._id })
      .populate("scheduleId")
      .lean();

    // Helper: was this group evaluated for a specific fypPart + week?
    const wasEvaluated = (fypPartStr, weekRegex) =>
      allEvaluations.some(
        e => e.scheduleId &&
          e.scheduleId.fypPart?.toLowerCase() === fypPartStr.toLowerCase() &&
          weekRegex.test(e.scheduleId.week)
      );

    const fyp1Week4Cleared = wasEvaluated("fyp-1", /week\s*4/i);
    const fyp1Week16Cleared = wasEvaluated("fyp-1", /week\s*16/i);
    const fyp2Week14Cleared = wasEvaluated("fyp-2", /week\s*14/i);

    // ── 2. Template counts ─────────────────────────────────────────────────
    const StudentUploadedTemplate = require("../models/StudentUploadedTemplate");

    const fyp1TemplateCount = await StudentUploadedTemplate.countDocuments({
      groupId: group._id,
      templateCode: { $in: ["t01", "t02", "t03", "t04", "t05", "t06", "t07"] },
      fypPart: 1,
      status: "Approved",
    });

    const fyp2TemplateCount = await StudentUploadedTemplate.countDocuments({
      groupId: group._id,
      templateCode: { $in: ["t05", "t06"] },
      fypPart: 2,
      status: "Approved",
    });

    const fyp1TemplatesDone = fyp1TemplateCount >= 7;
    const allTemplatesDone = (fyp1TemplateCount + fyp2TemplateCount) >= 9;

    // ── 5. Fetch ALL published schedules ──────────────────────────────────
    const allSchedules = await PresentationSchedule.find({ isPublish: true }).lean();

    // ── 7. Identify milestones currently booked ───────────────────────────
    const gId = group._id.toString();
    const activeBookings = [];
    const bookedMilestones = new Set();

    for (const sched of allSchedules) {
      const bookedSlot = (sched.slots || []).find(s => s.bookedBy?.toString() === gId);
      if (bookedSlot) {
        activeBookings.push({ ...sched, bookedSlot });
        const key = `${norm(sched.fypPart)}-${norm(sched.week)}`;
        bookedMilestones.add(key);
      }
    }

    const hasBookedW4 = bookedMilestones.has("fyp1-week4");
    const hasBookedW16 = bookedMilestones.has("fyp1-week16");
    const hasBookedW14_F2 = bookedMilestones.has("fyp2-week14");

    // ── 3. Eligibility gates ───────────────────────────────────────────────
    // FYP-2 Week 14 unlocks: FYP-1 W4 + FYP-1 W16 + 5 FYP-1 templates
    const fyp2Eligible = hasBookedW4 && hasBookedW16;

    const isPublishedAndPassed = (fypPartStr, weekRegex) => {
        const evals = allEvaluations.filter(e => 
            e.scheduleId && norm(e.scheduleId.fypPart) === norm(fypPartStr) && weekRegex.test(e.scheduleId.week)
        );
        if (evals.length === 0) return false;
        
        const latestEval = evals[evals.length - 1];
        if (!latestEval.isApprovedByCoordinator) return false;
        
        const panelSize = latestEval.scheduleId?.facultyPanels?.length || latestEval.evaluations?.length || 1;
        let totalSum = 0;
        (latestEval.evaluations || []).forEach(ev => {
            totalSum += (ev.totalCloMarks || 0);
        });
        const avg = totalSum / panelSize;
        const commScore = +(avg * 0.5).toFixed(2);
        
        return {
            passed: true,
            score: commScore
        };
    };

    const w16Result = isPublishedAndPassed("fyp-1", /week\s*16/i);
    const w16Passed = w16Result ? w16Result.passed : false;

    const w14Result = isPublishedAndPassed("fyp-2", /week\s*14/i);
    const w14Passed = w14Result ? w14Result.passed : false;

    // Completed = FYP-1 W16 passed AND FYP-2 W14 passed AND all 9 templates approved
    const isCompleted = w16Passed && w14Passed && allTemplatesDone;

    if (isCompleted) {
      return res.json({
        success: true,
        status: "completed",
        alreadyBooked: false,
        availableSlots: [],
        message: "Congratulations! You have successfully completed all FYP milestones and approved 9 templates.",
      });
    }
    // ── 6. Identify milestones cleared (evaluated) ────────────────────────
    const evaluatedScheduleIds = new Set(
      allEvaluations.map(e => (e.scheduleId?._id || e.scheduleId)?.toString())
    );

    const evaluatedMilestones = new Set();
    allEvaluations.forEach(e => {
       if (e.scheduleId) {
          const key = `${norm(e.scheduleId.fypPart)}-${norm(e.scheduleId.week)}`;
          evaluatedMilestones.add(key);
       }
    });

    const isW4DoneOrBooked = hasBookedW4 || evaluatedMilestones.has("fyp1-week4");

    const w4Result = isPublishedAndPassed("fyp-1", /week\s*4/i);
    const w4Passed = w4Result ? w4Result.passed : false;

    console.log(`[SlotsCheck] Group: ${group.groupId}, W4:${fyp1Week4Cleared}/${hasBookedW4}, W16:${fyp1Week16Cleared}/${hasBookedW16}`);


    // ── 8. Filter: Show all published schedules except ones already done/booked by THIS group ──
    let blockedReason = null;
    const filteredSchedules = allSchedules.filter(sched => {
      // Skip if already committee-evaluated for this group
      if (evaluatedScheduleIds.has(sched._id.toString())) return false;

      const part = norm(sched.fypPart);
      const week = norm(sched.week);
      const key = `${part}-${week}`;

      // Skip if this group already has a booking for this week+part
      if (bookedMilestones.has(key)) return false;

      // RULE 1: Week 16 flow -> cannot show unless Week 4 is booked or evaluated
      if (part === "fyp1" && week === "week16") {
          if (!isW4DoneOrBooked) {
              blockedReason = "You must book your Week 4 presentation before accessing Week 16 slots.";
              return false;
          }
      }

      // RULE 2: FYP 2 (Week 14 etc) -> cannot show unless Week 4 AND Week 16 are published and passed
      if (part === "fyp2") {
          if (!w4Passed || !w16Passed) {
              blockedReason = "FYP-2 slots are locked until the committee publishes your FYP-1 (Week 4 & Week 16) results and you have passed.";
              return false;
          }
      }

      return true;
    });

    console.log(`[SlotsCheck] Published: ${allSchedules.length}, Filtered: ${filteredSchedules.length}`);

    // ── 9. Build available slots ──────────────────────────────────────────
    const allAvailableSlots = [];
    for (const sched of filteredSchedules) {
      const freeSlots = (sched.slots || [])
        .filter(s => !s.bookedBy)
        .map(s => ({
          _id: s._id,
          startTime: s.startTime,
          endTime: s.endTime,
          week: sched.week || "",
          venue: sched.venue || "",
          fypPart: sched.fypPart || "",
          scheduleId: sched._id,
          bookedBy: null,
        }));
      allAvailableSlots.push(...freeSlots);
    }

    allAvailableSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Determine the general status
    let status = "active";
    // If no slots found AND we haven't booked everything yet
    if (allAvailableSlots.length === 0) {
      status = "waiting";
    }

    let message = "Active slots found.";
    if (allAvailableSlots.length === 0) {
      if (blockedReason) {
        message = blockedReason;
      } else if (filteredSchedules.length > 0) {
        message = "All slots for your current milestone are already booked by other groups. Please contact your coordinator to add more slots.";
      } else {
        message = "No presentation schedules have been published for your next milestone yet.";
      }
    }

    return res.json({
      success: true,
      status: status,
      alreadyBooked: activeBookings.length > 0,
      activeBookings: activeBookings,
      groupId: group._id,
      availableSlots: allAvailableSlots,
      message: message,
      eligibility: {
        fyp1Week4Cleared,
        fyp1Week16Cleared,
        w4Passed,
        w16Passed,
        w4Score: w4Result ? w4Result.score : null,
        w16Score: w16Result ? w16Result.score : null,
        fyp2Eligible,
        fyp1TemplatesDone,
        fyp2TemplateCount,
        allTemplatesDone,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};