const express = require("express");
const router = express.Router();
const {
  checkFacultyInPublishedPanel,
  resolveGroupById,
  bulkResolveGroups,
  getBookedGroupsForSchedule,
  getSingleGroups,
} = require("../controllers/EvaluationController");

// Faculty check route (used by Overview/Committee)
router.post("/checkFaculty", checkFacultyInPublishedPanel);

// Group resolution routes
router.post("/resolveGroup", resolveGroupById);
router.post("/bulkResolveGroups", bulkResolveGroups);

// New: get groups that booked slots for schedule(s)
router.post("/getBookedGroups", getBookedGroupsForSchedule);
router.post("/getSingleGroups", getSingleGroups);

module.exports = router;