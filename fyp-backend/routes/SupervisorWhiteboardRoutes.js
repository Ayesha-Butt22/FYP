const express = require("express");
const router = express.Router();
const {createNote,getAllNotesByGroups,deleteNote} = require("../controllers/SupervisorWhiteboardController");

// Create notice
router.post("/create", createNote);

// Get all notices grouped by group
router.get("/all-groups", getAllNotesByGroups);

// Delete notice by ID
router.delete("/delete/:id", deleteNote);

module.exports = router;
