// Project Ideas Controller
const ProjectIdea = require("../models/ProjectIdea");

// Create a new idea
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
    res.status(500).json({ error:
       "Server error" });
  }
};

// Get all ideas by supervisor
exports.getIdeasBySupervisor = async (req, res) => {
  const {   supervisorEmail } = req.params;

  try {
    const ideas = await ProjectIdea.find({ supervisorEmail }).sort({ createdAt: -1 });
    res.status(200).json(ideas);
  } catch (err) {
    console.error("Get Ideas Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete an idea by ID
exports.deleteIdea = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await ProjectIdea.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Idea not found" });

    res.status(200).json({ message: "Idea deleted successfully" });
  } catch (err) {
    console.error("Delete Idea Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
