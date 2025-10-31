const Group = require("../models/StudentGroup");
const Proposal = require("../models/StudentProposal");
const User = require("../models/User");
const mongoose = require("mongoose");

const emailToName = (email) => {
  if (!email || typeof email !== "string") return "";
  const local = email.split("@")[0] || "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return local;
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
};

exports.getGroupsWithMembersAndProposals = async (req, res) => {
  try {
    const groups = await Group.find({}).lean();

    if (!groups || groups.length === 0)
      return res.json({ success: true, count: 0, data: [] });

    const emailsSet = new Set();
    const groupIds = [];

    groups.forEach((g) => {
      groupIds.push(String(g._id));
      ["leader", "member2", "member3"].forEach((role) => {
        if (g[role] && g[role].email) emailsSet.add(g[role].email);
      });
    });

    const emails = Array.from(emailsSet);
    const users = emails.length
      ? await User.find({ email: { $in: emails } })
          .select("email name studentId sapId")
          .lean()
      : [];

    const userByEmail = {};
    users.forEach((u) => (userByEmail[u.email] = u));

    const proposals = await Proposal.find({
      groupId: { $in: groupIds.map((id) => new mongoose.Types.ObjectId(id)) },
    }).lean();

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

    const data = groups.map((g) => {
      const gid = String(g._id);
      const members = ["leader", "member2", "member3"]
        .map((role) => {
          const m = g[role];
          if (!m) return null;
          const email = m.email || null;
          const sapId = m.sapId || m.studentId || null;
          const user = email && userByEmail[email] ? userByEmail[email] : null;
          const name = user?.name || emailToName(email) || sapId || "Student";

          return { role, name, email, sapId };
        })
        .filter(Boolean);

      return {
        _id: g._id,
        groupId: g.groupId,
        members,
        proposals: proposalsByGroup[gid] || [],
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      };
    });

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("[GroupsInfoController] ❌", err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
};
