const express = require("express");
const router = express.Router();

const {
  createOrUpdatePresentationBatch,
  getPresentation,
  publishSchedule,
  getFaculty,
  bookSlot,
} = require("../controllers/deadlineScheduleController");

router.post("/createBatch", createOrUpdatePresentationBatch);
router.get("/get", getPresentation);
router.post("/publish/:id", publishSchedule);
router.get("/getfaculty", getFaculty);
router.post("/book/:slotId/:groupId", bookSlot);

module.exports = router;
