const SupervisorWhiteboard = require("../models/SupervisorWhiteboard");

// Create a new note
exports.createNote = async (req, res) => {
  try {
    const { groupId, description, supervisorEmail } = req.body;

    if (!groupId || !description || !supervisorEmail) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const note = new SupervisorWhiteboard({
      groupId,
      description,
      supervisorEmail,
    });

    const savedNote = await note.save();
    res.status(201).json(savedNote);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getAllNotesByGroups = async (req, res) => {
  try {
    const notes = await SupervisorWhiteboard.find().sort({ timestamp: -1 });
    // Group notes by groupId
    const grouped = {};
    notes.forEach((note) => {
      if (!grouped[note.groupId]) grouped[note.groupId] = [];
      grouped[note.groupId].push({
        content: note.description,
        date: new Date(note.timestamp).toLocaleString(),
        _id: note._id,
      });
    });
    res.status(200).json(grouped);
  } catch (error) {
    console.error("Error fetching all notes:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a note by ID
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    await SupervisorWhiteboard.findByIdAndDelete(id);
    res.status(200).json({ message: "Note deleted" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ message: "Server error" });
  }
};
