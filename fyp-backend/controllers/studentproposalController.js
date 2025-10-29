// controllers/studentproposalController.js
const mongoose = require("mongoose");
const Proposal = require("../models/StudentProposal");

exports.createProposal = async (req, res) => {
  try {
    const { groupId, projectTitle, projectDescription, projectTools, projectSupervisor } = req.body;

    if (!groupId || !projectTitle || !projectDescription) {
      return res.status(400).json({ error: "groupId, projectTitle aur projectDescription zaroori hain" });
    }

    const proposal = new Proposal({
      groupId,
      projectTitle,
      projectDescription,
      projectTools,
      projectSupervisor,
      projectStatus: 1
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

// NAYA: Supervisor apne proposals dekhe
exports.getMyProposals = async (req, res) => {
  try {
    const supervisorEmail = req.user.email;

    const proposals = await Proposal.find({ projectSupervisor: supervisorEmail })
      .populate({
        path: 'groupId',
        select: 'groupId leader member2 member3',
        populate: {
          path: 'leader member2 member3',
          select: 'name email studentId'
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: proposals.length,
      data: proposals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NAYA: Supervisor review kare
exports.reviewProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { projectStatus, projectSupervisorComments } = req.body;
    const supervisorEmail = req.user.email;

    const proposal = await Proposal.findById(id);
    if (!proposal) return res.status(404).json({ error: "Proposal not found" });

    if (proposal.projectSupervisor !== supervisorEmail) {
      return res.status(403).json({ error: "You can only review your assigned proposals" });
    }

    if (projectStatus !== undefined) proposal.projectStatus = projectStatus;
    if (projectSupervisorComments) proposal.projectSupervisorComments = projectSupervisorComments;

    await proposal.save();

    res.json({
      success: true,
      message: "Proposal reviewed successfully",
      proposal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProposalsByGroup = async (req, res) => {
  const param = req.params.groupId;
  console.log("[getProposalsByGroup] incoming param:", param);

  try {
    let proposals = [];

    // If param is a valid ObjectId string, try lookup using ObjectId
    if (typeof param === "string" && mongoose.isValidObjectId(param)) {
      try {
        // use `new` to construct ObjectId to avoid "cannot be invoked without 'new'" error
        const oid = new mongoose.Types.ObjectId(param);
        proposals = await Proposal.find({ groupId: oid }).populate("groupId");
        console.log("[getProposalsByGroup] looked up by ObjectId, found:", (proposals || []).length);
      } catch (err) {
        console.error("[getProposalsByGroup] error when searching by ObjectId:", err);
        // continue to fallback below
      }
    }

    // If nothing found by ObjectId, try searching by raw string (in case groupId stored as code)
    if (!proposals || proposals.length === 0) {
      proposals = await Proposal.find({ groupId: param }).populate("groupId");
      console.log("[getProposalsByGroup] looked up by string, found:", (proposals || []).length);
    }

    // If still nothing, return 404 so frontend can handle "no proposal"
    if (!proposals || proposals.length === 0) {
      console.log("[getProposalsByGroup] no proposals found for:", param);
      return res.status(404).json({ error: "No proposal found for this group." });
    }

    // Return found proposals
    return res.json(proposals);
  } catch (err) {
    console.error("[getProposalsByGroup] unexpected error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};