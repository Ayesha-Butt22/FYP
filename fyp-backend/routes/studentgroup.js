const express = require("express");
const { protect, isStudent } = require("../middlewares/authMiddleware");
const groupController = require("../controllers/studentGroupController");

const router = express.Router();

router.post("/", protect, isStudent, groupController.createGroup);
router.get("/all", groupController.getAllGroups);
router.get("/by-email/:email", protect, isStudent, groupController.getGroupByEmail);
router.get("/:id", protect, isStudent, groupController.getGroup);
router.delete("/:id", protect, isStudent, groupController.deleteGroup);

module.exports = router;


