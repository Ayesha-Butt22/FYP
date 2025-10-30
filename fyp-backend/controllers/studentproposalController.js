// controllers/studentproposalController.js
const mongoose = require("mongoose");
const Proposal = require("../models/StudentProposal");

exports.createProposal = async (req, res) => {
  try {
    const { groupId, projectTitle, projectDescription, projectTools, projectSupervisor } = req.body;

    // collect missing required fields
    const missing = [];
    if (!groupId) missing.push("groupId");
    if (!projectTitle) missing.push("projectTitle");
    if (!projectDescription) missing.push("projectDescription");

    if (missing.length > 0) {
      // Urdu message + structured list of missing fields
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

    // ensure only the assigned supervisor can review OR allow assign if none set and this user is the supervisor?
    // If you require that only assigned supervisor can review:
    if (proposal.projectSupervisor && proposal.projectSupervisor !== supervisorEmail) {
      return res.status(403).json({ error: "You can only review your assigned proposals" });
    }

    if (projectStatus !== undefined) proposal.projectStatus = projectStatus;
    if (projectSupervisorComments !== undefined) proposal.projectSupervisorComments = projectSupervisorComments;
    // Accept projectSupervisor in body to let students or supervisor assignment persist
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

exports.getMyProposals = async (req, res) => {
  try {
    const supervisorEmail = req.user.email;
    const proposals = await Proposal.find({ projectSupervisor: supervisorEmail })
      .populate({
        path: 'groupId',
        select: 'groupId leader member2 member3',
        populate: {
          path: 'leader member2 member3',
          select: 'name email studentId sapId'
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: proposals.length,
      data: proposals
    });
  } catch (err) {
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