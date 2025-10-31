const Group = require("../models/StudentGroup");
const Proposal = require("../models/StudentProposal");
const User = require("../models/User");
const mongoose = require("mongoose");

/**
 * Helper to derive a readable name from email when User.name is not available.
 */
const emailToName = (email) => {
  if (!email || typeof email !== "string") return "";
  const local = email.split("@")[0] || "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return local;
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
};

/**
 * GET /api/groups/info
 * Returns all groups, for each group returns:
 * - group _id and groupId
 * - members: array of { role: 'leader'|'member2'|'member3', name, email, sapId }
 * - proposals: array of proposals belonging to that group (fields: _id, projectTitle, projectDescription, projectTools, projectSupervisor, projectSpecialization, projectStatus, projectSupervisorComments, createdAt, updatedAt)
 */
exports.getGroupsWithMembersAndProposals = async (req, res) => {
  try {
    // 1) load all groups
    const groups = await Group.find({}).lean();

    // If no groups, return empty
    if (!groups || groups.length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    // 2) collect all emails present in groups to lookup User names in one query
    const emailsSet = new Set();
    const groupIds = [];

    groups.forEach((g) => {
      groupIds.push(String(g._id));
      if (g.leader && g.leader.email) emailsSet.add(g.leader.email);
      if (g.member2 && g.member2.email) emailsSet.add(g.member2.email);
      if (g.member3 && g.member3.email) emailsSet.add(g.member3.email);
    });
    const emails = Array.from(emailsSet);

    // 3) fetch users by email in bulk
    let users = [];
    if (emails.length > 0) {
      users = await User.find({ email: { $in: emails } })
        .select("email name studentId sapId")
        .lean();
    }
    const userByEmail = {};
    users.forEach((u) => {
      if (u && u.email) userByEmail[u.email] = u;
    });

    // 4) fetch all proposals for these groups in one query
    const proposals = await Proposal.find({ groupId: { $in: groupIds.map((id) => mongoose.Types.ObjectId(id)) } })
      .lean();

    // 5) map proposals by groupId
    const proposalsByGroup = {};
    proposals.forEach((p) => {
      const gid = String(p.groupId);
      if (!proposalsByGroup[gid]) proposalsByGroup[gid] = [];
      proposalsByGroup[gid].push({
        _id: p._id,
        projectTitle: p.projectTitle,
        projectDescription: p.projectDescription,
        projectTools: p.projectTools,
        projectSupervisor: p.projectSupervisor,
        projectSpecialization: p.projectSpecialization,
        projectSupervisorComments: p.projectSupervisorComments,
        projectStatus: p.projectStatus,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      });
    });

    // 6) build final response array
    const data = groups.map((g) => {
      const gid = String(g._id);

      const memberRoles = ["leader", "member2", "member3"];
      const members = memberRoles
        .map((role) => {
          const mem = g[role];
          if (!mem) return null;
          const email = mem.email || null;
          const sapId = mem.sapId || mem.studentId || null;

          // prefer name from User collection if available
          const user = email && userByEmail[email] ? userByEmail[email] : null;
          const name = user?.name || emailToName(email) || sapId || null;

          return {
            role,
            name,
            email: email || null,
            sapId: sapId || null,
          };
        })
        .filter(Boolean);

      const groupProposals = proposalsByGroup[gid] || [];

      return {
        _id: g._id,
        groupId: g.groupId,
        members,
        proposals: groupProposals,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      };
    });

    return res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("[GroupsInfoController] error:", err);
    return res.status(500).json({ success: false, error: err.message || "Server error" });
  }
};