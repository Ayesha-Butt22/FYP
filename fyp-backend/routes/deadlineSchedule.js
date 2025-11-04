const express = require("express");
const router = express.Router();

const {
  createOrUpdatePresentationBatch,
  getPresentation,
  publishSchedule,
  getFaculty,
  bookSlot,
  checkSlot,
} = require("../controllers/deadlineScheduleController");

router.post("/createBatch", createOrUpdatePresentationBatch);
router.get("/get", getPresentation);
router.post("/publish/:id", publishSchedule);
router.get("/getfaculty", getFaculty);
router.get("/getSlots/:email", checkSlot);
router.post("/book/:slotId/:groupId", bookSlot);

module.exports = router;
