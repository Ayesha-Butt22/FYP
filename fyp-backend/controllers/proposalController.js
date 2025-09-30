const Proposal = require("../models/Proposal");

exports.createProposal = async (req, res) => {
  try {
    const { groupId, projectTitle, projectDescription, projectTools, projectSupervisor } = req.body;

    const proposal = new Proposal({
      groupId,
      projectTitle,
      projectDescription,
      projectTools,
      projectSupervisor
    });

    await proposal.save();
    return res.status(201).json({ message: "Proposal created successfully", proposal });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getProposalsByGroup = async (req, res) => {
  try {
    const proposals = await Proposal.find({ groupId: req.params.groupId }).populate("groupId");
    return res.json(proposals);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
