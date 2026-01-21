const express = require("express");
const router = express.Router();
const controller = require("../controllers/semesterStartController");

router.get("/", controller.getSemesterStartDate);
router.put("/", controller.updateSemesterStartDate);

module.exports = router;
