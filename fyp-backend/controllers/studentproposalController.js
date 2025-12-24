// controllers/studentproposalController.js
const mongoose = require("mongoose");
const Proposal = require("../models/StudentProposal");
const User = require('../models/User');


exports.createProposal = async (req, res) => {
  try {
    const { groupId, projectTitle, projectDescription, projectTools, specialization , projectSupervisor ,projectStatus } = req.body;


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
      projectSpecialization : specialization,
      projectSupervisor,
      projectStatus: 0,
      projectSupervisorComments:null,
    });

    await proposal.save();

    res.status(201).json({
      success: true,
      message: "Proposal save ho gaya",
      proposal
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
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
      proposal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProposal = async (req , res) => {
  const { id } = req.params;
    try {
      const proposal =  await Proposal.findById(id);
      if (!proposal) return res.status(404).json({ error: "Proposal not found" });
      await proposal.deleteOne();
      return res.json({ message: "Proposal deleted successfully" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
};

exports.getMyProposals = async (req, res) => {
  try {
    const supervisorEmail = req.user.email;
    const proposals = await Proposal.find({ projectSupervisor: supervisorEmail })
        .populate({
          path: 'groupId',
          select: 'groupId leader member2 member3'
        })
        .sort({ createdAt: -1 }) .lean();


    for (const proposal of proposals) {
      const group = proposal.groupId;
      if (group) {
        const emails = [group.leader?.email, group.member2?.email, group.member3?.email].filter(Boolean);
        const users = await User.find({ email: { $in: emails } }, 'name email sapId');
        for (const u of users) {
          if (group.leader?.email === u.email) {
            group.leader.name = u.name
          }
          if (group.member2?.email === u.email) {
            group.member2.name = u.name
          }
          if (group.member3?.email === u.email) {
            group.member3.name = u.name
          };
        }
      }
    }
    res.json({
      success: true,
      count: proposals.length,
      data: proposals
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingProposals = async (req, res) => {
  try {
    const supervisorEmail = req.user.email;
    const now = new Date();
    const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);
    const sixteenHoursAgo = new Date(now.getTime() - 16 * 60 * 60 * 1000);

    const proposals = await Proposal.find({
      projectSupervisor: supervisorEmail,
      projectStatus: 0, // pending
      createdAt: { $gte: sixteenHoursAgo, $lte: tenHoursAgo },
    })
      .populate({
        path: "groupId",
        select: "groupId leader member2 member3",
      })
      .sort({ createdAt: -1 })
      .lean();

    for (const proposal of proposals) {
      const group = proposal.groupId;
      if (group) {
        const emails = [group.leader?.email, group.member2?.email, group.member3?.email].filter(Boolean);
        const users = await User.find({ email: { $in: emails } }, "name email sapId");
        for (const u of users) {
          if (group.leader?.email === u.email) group.leader.name = u.name;
          if (group.member2?.email === u.email) group.member2.name = u.name;
          if (group.member3?.email === u.email) group.member3.name = u.name;
        }
      }
    }

    res.json({ success: true, count: proposals.length, data: proposals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getProposalsByGroup = async (req, res) => {
  const param = req.params.groupId;

  try {
    let proposals = [];

    if (typeof param === "string" && mongoose.isValidObjectId(param)) {
      try {
        const oid = new mongoose.Types.ObjectId(param);
        proposals = await Proposal.find({ groupId: oid }).populate("groupId");
      } catch (err) {
      }
    }
    if (!proposals || proposals.length === 0) {
      proposals = await Proposal.find({ groupId: param }).populate("groupId");
    }
    if (!proposals || proposals.length === 0) {

      return res.status(404).json({ error: "No proposal found for this group." });
    }

    return res.json(proposals);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Server error" });
  }
};