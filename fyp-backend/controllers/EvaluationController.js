//EvaluationController
const mongoose = require("mongoose");
const User = require("../models/User");
const Group = require("../models/StudentGroup");
const PresentationSchedule = require("../models/DeadlineSchedule");
const Proposal = require("../models/StudentProposal");


exports.checkFacultyInPublishedPanel = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({
      email,
      role: { $in: ["supervisor", "coordinator"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or not authorized role",
      });
    }

    const alreadyAssigned = await PresentationSchedule.find({
      isPublish: true,
      facultyPanels: user._id,
    }).populate("slots.bookedBy", "groupId projectTitle");



    const groups = await Proposal.find({ projectSupervisor: email });

    const groupsWithSlots = [];
    for (const group of groups) {
      const schedule = await PresentationSchedule.findOne({
        "slots.bookedBy": group.groupId,
      });

      const grp = await Group.findOne({
        "_id": group.groupId,
      });
      groupsWithSlots.push({
        displayId: grp.groupId,
        groupId: group.groupId,
        bookedSlot: schedule
          ? schedule.slots.find((s) => s.bookedBy?.toString() === group.groupId.toString())
          : null,
        scheduleInfo: schedule
          ? {
            week: schedule.week,
            fypPart: schedule.fypPart,
            venue: schedule.venue,
          }
          : null,
      });
    }

    if (alreadyAssigned) {
      return res.status(200).json({
        success: true,
        message: "You are listed for panel",
        facultyId: user._id,
        scheduleId: alreadyAssigned._id,
        week: alreadyAssigned.week,
        venue: alreadyAssigned.venue,
        fypPart: alreadyAssigned.fypPart,
        data: alreadyAssigned,
        groupsSupervised: groupsWithSlots,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Faculty is not yet assigned in any published panel",
      facultyId: user._id,
    });
  } catch (error) {
    console.error("Error in checkFacultyInPublishedPanel:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


exports.getBookedGroupsForSchedule = async (req, res) => {
  try {
    const { scheduleId, week, fypPart, venue } = req.body || {};

    let schedules = [];

    if (scheduleId) {
      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        return res.status(400).json({ success: false, message: "Invalid scheduleId" });
      }
      const sched = await PresentationSchedule.findById(scheduleId).lean();
      if (!sched) return res.status(404).json({ success: false, message: "Schedule not found" });
      schedules = [sched];
    } else {
      if (!week || !fypPart) {
        return res.status(400).json({ success: false, message: "Either scheduleId or (week and fypPart) required" });
      }
      const q = { week, fypPart };
      if (venue) q.venue = venue;
      schedules = await PresentationSchedule.find(q).lean();
      if (!schedules || !schedules.length) return res.json({ success: true, data: [] });
    }

    // Collect booked group ObjectIds (slot.bookedBy)
    const bookedSet = new Set();
    schedules.forEach(s => {
      (s.slots || []).forEach(slot => {
        if (!slot) return;
        const b = slot.bookedBy;
        if (!b) return;
        try {
          const idStr = String(b._id ?? b);
          if (idStr && idStr !== "null" && idStr !== "undefined") bookedSet.add(idStr);
        } catch {
          const idStr = String(b);
          if (idStr && idStr !== "null" && idStr !== "undefined") bookedSet.add(idStr);
        }
      });
    });

    const bookedGroupIds = Array.from(bookedSet);
    if (!bookedGroupIds.length) return res.json({ success: true, data: [] });


    const groups = await Group.find({ _id: { $in: bookedGroupIds } }).lean();
    if (!groups.length) return res.json({ success: true, data: [] });


    const emailSet = new Set();
    const sapSet = new Set();
    groups.forEach(g => {
      ["leader", "member2", "member3"].forEach(k => {
        const m = g[k];
        if (!m) return;
        if (m.email) emailSet.add(String(m.email).toLowerCase());
        if (m.sapId) sapSet.add(String(m.sapId));
      });
    });

    const or = [];
    if (emailSet.size) or.push({ email: { $in: Array.from(emailSet) } });
    if (sapSet.size) or.push({ studentId: { $in: Array.from(sapSet) } });

    const users = or.length ? await User.find({ $or: or }).lean() : [];


    const userByEmail = {};
    const userByStudentId = {};
    users.forEach(u => {
      if (u.email) userByEmail[String(u.email).toLowerCase()] = u;
      if (u.studentId) userByStudentId[String(u.studentId)] = u;
    });


    const result = await Promise.all(
      groups.map(async (g) => {
        const members = [];

        ["leader", "member2", "member3"].forEach((k) => {
          const m = g[k];
          if (!m) return;
          const email = m.email ? String(m.email).toLowerCase() : null;
          const sap = m.sapId ? String(m.sapId) : null;
          const matchedUser =
            (email && userByEmail[email]) ||
            (sap && userByStudentId[sap]) ||
            null;

          members.push({
            role: k === "leader" ? "leader" : "member",
            name: matchedUser?.name || m.name || (k === "leader" ? "Leader" : `Member ${k.slice(-1)}`),
            email: matchedUser?.email || m.email || null,
            studentId: matchedUser?.studentId || m.sapId || null,
            userId: matchedUser?._id || null,
          });
        });

        const project = await Proposal.findOne({ groupId: g._id }).lean();

        return {
          groupId: g.groupId || null,
          groupMongoId: g._id,
          proposalTitle: g.proposalTitle || g.projectTitle || null,
          members,
          raw: g,
          project: project || null,
        };
      })
    );


    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("getBookedGroupsForSchedule error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};



exports.getSingleGroups = async (req, res) => {
  try {
    const { scheduleId, slotId, week, fypPart, venue } = req.body || {};

    let schedules = [];

    if (scheduleId) {
      if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
        return res.status(400).json({ success: false, message: "Invalid scheduleId" });
      }
      const query = { _id: scheduleId };

      if (slotId) {
        if (!mongoose.Types.ObjectId.isValid(slotId)) {
          return res.status(400).json({ success: false, message: "Invalid slotId" });
        }
        query["slots._id"] = slotId;
      }
      const sched = await PresentationSchedule.findOne(query).lean();
      if (!sched) {
        return res.status(404).json({ success: false, message: "Schedule not found" });
      }
      if (slotId) {
        sched.slots = sched.slots.filter(
          (slot) => String(slot._id) === String(slotId)
        );
      }
      schedules = [sched];
    }
    else {
      if (!week || !fypPart) {
        return res.status(400).json({
          success: false,
          message: "Either scheduleId or (week and fypPart) required",
        });
      }
      const q = { week, fypPart };
      if (venue) q.venue = venue;
      schedules = await PresentationSchedule.find(q).lean();
      if (!schedules || !schedules.length) return res.json({ success: true, data: [] });
    }

    const bookedSet = new Set();
    schedules.forEach(s => {
      (s.slots || []).forEach(slot => {
        if (!slot) return;
        const b = slot.bookedBy;
        if (!b) return;
        try {
          const idStr = String(b._id ?? b);
          if (idStr && idStr !== "null" && idStr !== "undefined") bookedSet.add(idStr);
        } catch {
          const idStr = String(b);
          if (idStr && idStr !== "null" && idStr !== "undefined") bookedSet.add(idStr);
        }
      });
    });

    const bookedGroupIds = Array.from(bookedSet);
    if (!bookedGroupIds.length) return res.json({ success: true, data: [] });


    const groups = await Group.find({ _id: { $in: bookedGroupIds } }).lean();
    if (!groups.length) return res.json({ success: true, data: [] });


    const emailSet = new Set();
    const sapSet = new Set();
    groups.forEach(g => {
      ["leader", "member2", "member3"].forEach(k => {
        const m = g[k];
        if (!m) return;
        if (m.email) emailSet.add(String(m.email).toLowerCase());
        if (m.sapId) sapSet.add(String(m.sapId));
      });
    });

    const or = [];
    if (emailSet.size) or.push({ email: { $in: Array.from(emailSet) } });
    if (sapSet.size) or.push({ studentId: { $in: Array.from(sapSet) } });

    const users = or.length ? await User.find({ $or: or }).lean() : [];


    const userByEmail = {};
    const userByStudentId = {};
    users.forEach(u => {
      if (u.email) userByEmail[String(u.email).toLowerCase()] = u;
      if (u.studentId) userByStudentId[String(u.studentId)] = u;
    });


    const result = await Promise.all(
      groups.map(async (g) => {
        const members = [];

        ["leader", "member2", "member3"].forEach((k) => {
          const m = g[k];
          if (!m) return;
          const email = m.email ? String(m.email).toLowerCase() : null;
          const sap = m.sapId ? String(m.sapId) : null;
          const matchedUser =
            (email && userByEmail[email]) ||
            (sap && userByStudentId[sap]) ||
            null;

          members.push({
            role: k === "leader" ? "leader" : "member",
            name: matchedUser?.name || m.name || (k === "leader" ? "Leader" : `Member ${k.slice(-1)}`),
            email: matchedUser?.email || m.email || null,
            studentId: matchedUser?.studentId || m.sapId || null,
            userId: matchedUser?._id || null,
          });
        });

        const project = await Proposal.findOne({ groupId: g._id }).lean();

        return {
          groupId: g.groupId || null,
          groupMongoId: g._id,
          proposalTitle: g.proposalTitle || g.projectTitle || null,
          members,
          raw: g,
          project: project || null,
        };
      })
    );


    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("getBookedGroupsForSchedule error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};



exports.resolveGroupById = async (req, res) => {
  try {
    const { groupId } = req.body;
    if (!groupId) return res.status(400).json({ ok: false, message: "groupId required" });

    const group = await Group.findOne({ groupId }).lean();
    if (!group) return res.status(404).json({ ok: false, message: "Group not found" });

    const membersRaw = [];
    if (group.leader && (group.leader.email || group.leader.sapId)) membersRaw.push({ role: "leader", ...group.leader });
    if (group.member2 && (group.member2.email || group.member2.sapId)) membersRaw.push({ role: "member", ...group.member2 });
    if (group.member3 && (group.member3.email || group.member3.sapId)) membersRaw.push({ role: "member", ...group.member3 });

    const orClauses = [];
    membersRaw.forEach(m => {
      if (m.email) orClauses.push({ email: m.email });
      if (m.sapId) orClauses.push({ studentId: m.sapId });
    });

    let users = [];
    if (orClauses.length) users = await User.find({ $or: orClauses }).lean();

    const membersResolved = membersRaw.map(m => {
      const matched = users.find(
        u => (m.email && u.email === m.email) || (m.sapId && u.studentId === m.sapId)
      );

      return matched
        ? {
          role: m.role,
          sapId: matched.studentId || m.sapId || null,
          email: matched.email,
          name: matched.name || "",
          userId: matched._id,
        }
        : {
          role: m.role,
          sapId: m.sapId || null,
          email: m.email || null,
          name: null,
          userId: null,
        };
    });

    return res.json({
      ok: true,
      group: {
        groupId: group.groupId,
        proposalTitle: group.proposalTitle || group.projectTitle || null,
        members: membersResolved,
        raw: group,
      },
    });
  } catch (err) {
    console.error("resolveGroupById error", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};


exports.bulkResolveGroups = async (req, res) => {
  try {
    const { groupIds } = req.body;
    if (!Array.isArray(groupIds) || !groupIds.length) {
      return res.status(400).json({ ok: false, message: "groupIds array required" });
    }

    const groups = await Group.find({ groupId: { $in: groupIds } }).lean();

    const orClauses = [];
    groups.forEach(group => {
      ["leader", "member2", "member3"].forEach(k => {
        if (group[k]) {
          if (group[k].email) orClauses.push({ email: group[k].email });
          if (group[k].sapId) orClauses.push({ studentId: group[k].sapId });
        }
      });
    });

    let users = [];
    if (orClauses.length) users = await User.find({ $or: orClauses }).lean();

    const result = groups.map(group => {
      const membersRaw = [];
      if (group.leader) membersRaw.push({ role: "leader", ...group.leader });
      if (group.member2) membersRaw.push({ role: "member", ...group.member2 });
      if (group.member3) membersRaw.push({ role: "member", ...group.member3 });

      const membersResolved = membersRaw.map(m => {
        const matched = users.find(
          u => (m.email && u.email === m.email) || (m.sapId && u.studentId === m.sapId)
        );
        return matched
          ? {
            role: m.role,
            sapId: matched.studentId || m.sapId || null,
            email: matched.email,
            name: matched.name || "",
            userId: matched._id,
          }
          : {
            role: m.role,
            sapId: m.sapId || null,
            email: m.email || null,
            name: null,
            userId: null,
          };
      });

      return {
        groupId: group.groupId,
        proposalTitle: group.proposalTitle || group.projectTitle || null,
        members: membersResolved,
        raw: group,
      };
    });

    return res.json({ ok: true, groups: result });
  } catch (err) {
    console.error("bulkResolveGroups error", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

exports.resolveFinalEvaluationType = async (req, res) => {
  try {
    const { groupId } = req.body;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "groupId required",
      });
    }

    const Group = require("../models/StudentGroup");
    const User = require("../models/User");
    const Template = require("../models/Template");

    // 1️⃣ Find group by display groupId
    const group = await Group.findOne({ groupId }).lean();

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // 2️⃣ Get leader email or sapId
    const leader = group.leader;

    if (!leader) {
      return res.status(400).json({
        success: false,
        message: "Leader not found in group",
      });
    }

    // 3️⃣ Find leader user record
    let studentUser = null;

    if (leader.email) {
      studentUser = await User.findOne({ email: leader.email }).lean();
    } else if (leader.sapId) {
      studentUser = await User.findOne({ studentId: leader.sapId }).lean();
    }

    if (!studentUser) {
      return res.status(400).json({
        success: false,
        message: "Student user not found",
      });
    }

    const department = studentUser.department;

    if (!department) {
      return res.status(400).json({
        success: false,
        message: "Department not found in student profile",
      });
    }

    // 4️⃣ Check how many templates (t01-t05) are approved
    const StudentUploadedTemplate = require("../models/StudentUploadedTemplate");
    const CommitteeEvaluation = require("../models/CommitteeEvaluation");
    const PresentationSchedule = require("../models/DeadlineSchedule"); // which is PresentationSchedule model

    const approvedTemplatesCount = await StudentUploadedTemplate.countDocuments({
      groupId: group._id,
      templateCode: { $in: ["t01", "t02", "t03", "t04", "t05", "t07"] },
      status: "Approved",
    });

    // 5️⃣ Check if FYP-1 Week 4 and Week 16 are cleared (evaluated)
    const evals = await CommitteeEvaluation.find({ groupId: group._id }).populate("scheduleId");

    // Check if evaluation exists for fyp-1 Week 4 and fyp-1 Week 16
    const week4Cleared = evals.some(e => e.scheduleId && e.scheduleId.fypPart === "fyp-1" && /week\s*4/i.test(e.scheduleId.week));
    const week16Cleared = evals.some(e => e.scheduleId && e.scheduleId.fypPart === "fyp-1" && /week\s*16/i.test(e.scheduleId.week));

    let fypPart = "fyp-1";
    const isEligibleForFyp2 = (approvedTemplatesCount >= 6) && week4Cleared && week16Cleared;

    if (isEligibleForFyp2) {
      fypPart = "fyp-2";
    }

    return res.status(200).json({
      success: true,
      groupId: group.groupId,
      department,
      fypPart,
      eligibility: {
        templatesApproved: approvedTemplatesCount >= 6,
        week4Cleared,
        week16Cleared,
        isEligibleForFyp2
      }
    });

  } catch (err) {
    console.error("resolveFinalEvaluationType error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};