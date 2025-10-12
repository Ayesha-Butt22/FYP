console.log("✅ Student routes file loaded");
const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const studentController = require("../controllers/studentController");

const router = express.Router();


router.get("/supervisors", studentController.getAvailableSupervisors);


module.exports = router;
