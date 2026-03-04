const express = require("express");
const router = express.Router();
const GroupsInfoController = require("../controllers/GroupsInfoController");
const { protect, isCoordinator } = require("../middlewares/authMiddleware");

router.get("/info", protect, isCoordinator, GroupsInfoController.getGroupsWithMembersAndProposals);

module.exports = router;