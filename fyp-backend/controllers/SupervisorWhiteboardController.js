const SupervisorWhiteboard = require("../models/SupervisorWhiteboard");
const Group = require('../models/StudentGroup');

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

exports.getStudentWhiteboardNotes = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const group = await Group.findOne({
      $or: [
        { "leader.email": email },
        { "member2.email": email },
        { "member3.email": email },
      ],
    });

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found for this email" });
    }

    const notes = await SupervisorWhiteboard.find({ groupId: group.groupId })
        .sort({ timestamp: -1 });

    return res.json({
      success: true,
      groupId: group.groupId,
      notes: notes.map((n) => ({
        _id: n._id,
        groupId: n.groupId,
        content: n.description,
        date: new Date(n.timestamp).toLocaleString(),
        supervisorEmail: n.supervisorEmail,
      })),
    });
  } catch (err) {
    console.error("Error fetching student whiteboard notes:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};