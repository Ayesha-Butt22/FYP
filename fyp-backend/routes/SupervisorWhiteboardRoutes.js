const express = require("express");
const router = express.Router();
const {createNote,getAllNotesByGroups,deleteNote , getStudentWhiteboardNotes} = require("../controllers/SupervisorWhiteboardController");

// Create notice
router.post("/create", createNote);

// Get all notices grouped by group
router.get("/all-groups", getAllNotesByGroups);

// Delete notice by ID
router.delete("/delete/:id", deleteNote);

router.get("/studentWhiteboard/:email", getStudentWhiteboardNotes);

module.exports = router;
