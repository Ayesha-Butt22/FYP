// controllers/studentproposalController.js
const mongoose = require("mongoose");
const Proposal = require("../models/StudentProposal"); // adjust if your model file is named differently
const User = require("../models/User");

/**
 * Create a new proposal (student)
 */
exports.createProposal = async (req, res) => {
  try {
    const { groupId, projectTitle, projectDescription, projectTools, specialization, projectSupervisor } = req.body;

    const missing = [];
    if (!groupId) missing.push("groupId");
    if (!projectTitle) missing.push("projectTitle");
    if (!projectDescription) missing.push("projectDescription");

    if (missing.length > 0) {
      return res.status(400).json({
        error: "groupId, projectTitle aur projectDescription zaroori hain",
        missingFields: missing,
      });
    }

    const proposal = new Proposal({
      groupId,
      projectTitle,
      projectDescription,
      projectTools,
      projectSpecialization: specialization,
      projectSupervisor,
      projectStatus: 0,
      projectSupervisorComments: null,
    });

    await proposal.save();

    res.status(201).json({
      success: true,
      message: "Proposal save ho gaya",
      proposal,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Review/update proposal status (supervisor)
 */
exports.reviewProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { projectStatus, projectSupervisorComments, projectSupervisor } = req.body;
    const supervisorEmail = req.user.email;

    const proposal = await Proposal.findById(id);
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });
    if (proposal.projectSupervisor && proposal.projectSupervisor !== supervisorEmail) {
      return res.status(403).json({ error: "You can only review your assigned proposals" });
    }

    if (projectStatus !== undefined) proposal.projectStatus = projectStatus;
    if (projectSupervisorComments !== undefined) proposal.projectSupervisorComments = projectSupervisorComments;
    if (projectSupervisor !== undefined) proposal.projectSupervisor = projectSupervisor;

    await proposal.save();

    res.json({
      success: true,
      message: "Proposal reviewed/updated successfully",
      proposal,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a proposal (student)
 */
exports.deleteProposal = async (req, res) => {
  const { id } = req.params;
  try {
    const proposal = await Proposal.findById(id);
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });
    await proposal.deleteOne();
    return res.json({ message: "Proposal deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Get all proposals assigned to the logged-in supervisor
 */
exports.getMyProposals = async (req, res) => {
  try {
    const supervisorEmail = req.user.email;
    let proposals = await Proposal.find({ projectSupervisor: supervisorEmail })
      .populate({
        path: "groupId",
        select: "groupId leader member2 member3"
      })
      .sort({ createdAt: -1 })
      .lean();

    proposals = proposals.filter(p => p.groupId !== null);

    for (const proposal of proposals) {
      const group = proposal.groupId;
      if (group) {
        const emails = [group.leader?.email, group.member2?.email, group.member3?.email].filter(Boolean);
        if (emails.length) {
          const users = await User.find({ email: { $in: emails } }, "name email sapId");
          for (const u of users) {
            if (group.leader?.email === u.email) group.leader.name = u.name;
            if (group.member2?.email === u.email) group.member2.name = u.name;
            if (group.member3?.email === u.email) group.member3.name = u.name;
          }
        }
      }
    }

    res.json({
      success: true,
      count: proposals.length,
      data: proposals,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * getPendingProposals
 * - projectSupervisor must match logged-in user
 * - projectStatus treated as pending if 0, null, or missing
 * - createdAt between now - 16 hours and now - 10 hours
 */
exports.getPendingProposals = async (req, res) => {
  try {
    const supervisorEmail = req.user.email;
    const now = new Date();
    const sixteenHoursAgo = new Date(now.getTime() - 16 * 60 * 60 * 1000);
    const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);

    const pendingStatusClause = {
      $or: [{ projectStatus: 0 }, { projectStatus: null }, { projectStatus: { $exists: false } }],
    };

    const query = {
      projectSupervisor: supervisorEmail,
      createdAt: { $gte: sixteenHoursAgo, $lte: tenHoursAgo },
      ...pendingStatusClause,
    };

    let proposals = await Proposal.find(query)
      .populate({
        path: "groupId",
        select: "groupId leader member2 member3"
      })
      .sort({ createdAt: -1 })
      .lean();

    proposals = proposals.filter(p => p.groupId !== null);

    // Enrich group members' names
    for (const proposal of proposals) {
      const group = proposal.groupId;
      if (group) {
        const emails = [group.leader?.email, group.member2?.email, group.member3?.email].filter(Boolean);
        if (emails.length) {
          const users = await User.find({ email: { $in: emails } }, "name email sapId");
          for (const u of users) {
            if (group.leader?.email === u.email) group.leader.name = u.name;
            if (group.member2?.email === u.email) group.member2.name = u.name;
            if (group.member3?.email === u.email) group.member3.name = u.name;
          }
        }
      }
    }

    // Include server-side time-left for convenience (milliseconds until 16h mark)
    const nowMs = Date.now();
    const withTimeLeft = proposals.map((p) => {
      const created = p.createdAt ? new Date(p.createdAt).getTime() : null;
      const timeLeftMs = created ? Math.max(created + 16 * 60 * 60 * 1000 - nowMs, 0) : 0;
      return { ...p, timeLeftMs };
    });

    res.json({
      success: true,
      count: withTimeLeft.length,
      data: withTimeLeft,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get proposals by groupId (id or display string)
 *
 * Added: auto-delete any proposal that:
 *   - has projectStatus === 0 (pending)
 *   - and is older than 24 hours from createdAt
 *
 * After cleanup, return remaining proposals for the group (or 404 if none).
 */
exports.getProposalsByGroup = async (req, res) => {
  const param = req.params.groupId;

  try {
    // initial find (attempt by ObjectId first)
    let proposals = [];

    if (typeof param === "string" && mongoose.isValidObjectId(param)) {
      try {
        const oid = new mongoose.Types.ObjectId(param);
        proposals = await Proposal.find({ groupId: oid }).populate("groupId");
      } catch (err) {
        // ignore and fallback to string match
      }
    }

    if (!proposals || proposals.length === 0) {
      proposals = await Proposal.find({ groupId: param }).populate("groupId");
    }

    if (!proposals || proposals.length === 0) {
      return res.status(404).json({ error: "No proposal found for this group." });
    }

    // CLEANUP: delete any pending proposals older than 24 hours
    const nowMs = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    const toDeleteIds = [];
    for (const p of proposals) {
      const createdMs = p.createdAt ? new Date(p.createdAt).getTime() : null;
      if (createdMs && (p.projectStatus === 0 || p.projectStatus === "0" || p.projectStatus === null || p.projectStatus === undefined)) {
        if (nowMs - createdMs > twentyFourHoursMs) {
          toDeleteIds.push(p._id);
        }
      }
    }

    if (toDeleteIds.length > 0) {
      // delete all expired pending proposals
      await Proposal.deleteMany({ _id: { $in: toDeleteIds } });
    }

    // fetch remaining proposals after cleanup
    let remaining = [];
    if (typeof param === "string" && mongoose.isValidObjectId(param)) {
      try {
        const oid = new mongoose.Types.ObjectId(param);
        remaining = await Proposal.find({ groupId: oid }).populate("groupId").lean();
      } catch (err) {
        // fallback
      }
    }
    if (!remaining || remaining.length === 0) {
      remaining = await Proposal.find({ groupId: param }).populate("groupId").lean();
    }

    if (!remaining || remaining.length === 0) {
      return res.status(404).json({ error: "No proposal found for this group." });
    }

    return res.json(remaining);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
};