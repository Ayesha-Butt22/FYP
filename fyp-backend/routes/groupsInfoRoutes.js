const express = require("express");
const router = express.Router();
const GroupsInfoController = require("../controllers/GroupsInfoController");

let protect = (req, res, next) => next();



router.get("/info", protect, GroupsInfoController.getGroupsWithMembersAndProposals);

module.exports = router;
