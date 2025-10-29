// routes/reports.js
const express = require("express");
const router = express.Router();
const {
  getAllStudentsWithGroupAndProposal,
  getStudentsByEmails
} = require("../controllers/reportController");

// NO MIDDLEWARE — Open access
router.get("/all", getAllStudentsWithGroupAndProposal);
router.get("/by-emails", getStudentsByEmails);

module.exports = router;