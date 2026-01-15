const express = require("express");
const router = express.Router();
const {
  createSlot,
  getSupervisorMeetings,
  getAvailableSlots,
  bookSlot,
  getStudentMeetings,
  markDone
} = require("../controllers/meetingController");

router.post("/create-slot", createSlot);
router.get("/supervisor/:email", getSupervisorMeetings);
router.get("/available/:email", getAvailableSlots);
router.post("/book", bookSlot);
router.get("/student/:email", getStudentMeetings);
router.post("/mark-done", markDone);

module.exports = router;
