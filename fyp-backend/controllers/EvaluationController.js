const mongoose = require("mongoose");
const User = require("../models/User");
const Group = require("../models/StudentGroup");
const PresentationSchedule = require("../models/DeadlineSchedule");
const Proposal = require("../models/StudentProposal");

/**
 * POST /api/evaluation/checkFaculty
 * Body: { email }
 * - Checks user exists and role is supervisor/coordinator
 * - Returns first published schedule that includes this faculty (if any)
 */
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

    // Find any published schedule where this user is in facultyPanels
    const alreadyAssigned = await PresentationSchedule.findOne({
      isPublish: true,
      facultyPanels: user._id,
    });

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

/**
 * POST /api/evaluation/getBookedGroups
 * Body: { scheduleId } OR { week, fypPart, venue? }
 *
 * Returns: { success: true, data: [ { groupId, groupMongoId, proposalTitle, members: [{role,name,email,studentId,userId}], raw } ] }
 */
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

    // Fetch groups by _id
    const groups = await Group.find({ _id: { $in: bookedGroupIds } }).lean();
    if (!groups.length) return res.json({ success: true, data: [] });

    // Collect email and sapId values to resolve in User collection
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

    // Index users
    const userByEmail = {};
    const userByStudentId = {};
    users.forEach(u => {
      if (u.email) userByEmail[String(u.email).toLowerCase()] = u;
      if (u.studentId) userByStudentId[String(u.studentId)] = u;
    });


    // Build result array
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
              name: matchedUser?.name || m.name || null,
              email: matchedUser?.email || m.email || null,
              studentId: matchedUser?.studentId || m.sapId || null,
              userId: matchedUser?._id || null,
            });
          });

          // ✅ await the DB call
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

/**
 * POST /api/evaluation/resolveGroup
 * Body: { groupId }
 * Returns group members resolved to User records when possible.
 */
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

/**
 * POST /api/evaluation/bulkResolveGroups
 * Body: { groupIds: ["G-101","G-102"] }
 * Returns resolved members for each group.
 */
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