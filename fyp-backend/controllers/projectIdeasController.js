const ProjectIdea = require("../models/ProjectIdea");
const Group = require("../models/StudentGroup");
const Proposal = require("../models/StudentProposal");
const User = require("../models/User");
/* ===============================
   CREATE PROJECT IDEA (existing)
================================ */
exports.createIdea = async (req, res) => {
  const { supervisorEmail, title } = req.body;

  if (!supervisorEmail || !title) {
    return res.status(400).json({ error: "Supervisor ID and title are required" });
  }

  try {
    const newIdea = await ProjectIdea.create({ supervisorEmail, title });
    res.status(201).json(newIdea);
  } catch (err) {
    console.error("Create Idea Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ===============================
   GET IDEAS BY SUPERVISOR (existing)
================================ */
exports.getIdeasBySupervisor = async (req, res) => {
  const { supervisorEmail } = req.params;

  try {
    const ideas = await ProjectIdea
      .find({ supervisorEmail })
      .sort({ createdAt: -1 });

    res.status(200).json(ideas);
  } catch (err) {
    console.error("Get Ideas Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/* ===============================
   DELETE IDEA (existing)
================================ */
exports.deleteIdea = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await ProjectIdea.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Idea not found" });
    }

    res.status(200).json({ message: "Idea deleted successfully" });
  } catch (err) {
    console.error("Delete Idea Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


exports.getIdeasForStudent = async (req, res) => {
  
  const { studentEmail } = req.params;
 
  const sapId = studentEmail.trim();

  try {
    /* STEP 1: Find group using student email */
    
    const group = await Group.findOne({
          $or: [
            { "leader.sapId": sapId },
            { "member2.sapId": sapId },
            { "member3.sapId": sapId },
          ],
        });
    

    if (!group) {
      return res.status(404).json({
        message: "The student has not created any group yet"
      });
    }

   
    const groupId = group._id;

   
    const proposal = await Proposal.findOne({ groupId });

    if (!proposal) {
      return res.status(404).json({
        message: "No proposal has been submitted for this group"
      });
    }

    /* STEP 4: Get supervisor email from proposal */
    const supervisorEmail = proposal.projectSupervisor;

    if (!supervisorEmail) {
      return res.status(404).json({
        message: "No supervisor has been assigned in the proposal"
      });
    }

   
    const ideas = await ProjectIdea.find({ supervisorEmail })
      .sort({ createdAt: -1 });
const user = await User.findOne({ email: supervisorEmail });

    res.status(200).json({
      supervisorEmail,
      ideas,
      user
    });

  } catch (error) {
    console.error("Get Ideas For Student Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
