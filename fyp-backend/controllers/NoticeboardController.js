const Noticeboard = require("../models/Noticeboard"); // <- corrected require
const mongoose = require("mongoose");

// Get all notices
exports.getAllNotices = async (req, res) => {
  try {
    const notices = await Noticeboard.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: notices.length, data: notices });
  } catch (err) {
    console.error("Error fetching notices:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Create a new notice
exports.createNotice = async (req, res) => {
  try {
    const { title, description, audience, department , role } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, error: "Title and description required" });
    }




    const newNotice = await Noticeboard.create({
      title,
      description,
      audience: audience || "All",
      department: department || "All",
      postedBy: role ? role : "Admin",
    });

    return res.status(201).json({ success: true, notice: newNotice });
  } catch (err) {
    console.error("Error creating notice:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Update an existing notice
exports.updateNotice = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, error: "Invalid id" });

    const notice = await Noticeboard.findByIdAndUpdate(id, req.body, { new: true });
    if (!notice) return res.status(404).json({ success: false, error: "Notice not found" });

    return res.json({ success: true, notice });
  } catch (err) {
    console.error("Error updating notice:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// Delete a notice
exports.deleteNotice = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, error: "Invalid id" });

    const notice = await Noticeboard.findByIdAndDelete(id);
    if (!notice) return res.status(404).json({ success: false, error: "Notice not found" });

    return res.json({ success: true, message: "Notice deleted", notice });
  } catch (err) {
    console.error("Error deleting notice:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};