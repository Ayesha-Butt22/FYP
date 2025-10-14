const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const studentController = require("../controllers/studentController");

const router = express.Router();


router.get("/supervisors/:spec", studentController.getAvailableSupervisors);


module.exports = router;
