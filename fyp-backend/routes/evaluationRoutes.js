const express = require("express");
const router = express.Router();
const { checkFacultyInPublishedPanel } = require("../controllers/EvaluationController");

router.post("/checkFaculty", checkFacultyInPublishedPanel);

module.exports = router;
