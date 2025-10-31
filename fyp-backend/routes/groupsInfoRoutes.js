const express = require("express");
const router = express.Router();
const GroupsInfoController = require("../controllers/GroupsInfoController");

let protect = (req, res, next) => next();

try {
  const auth = require("../middleware/authMiddleware");
  if (auth && typeof auth.protect === "function") protect = auth.protect;
  else if (typeof auth === "function") protect = auth;
} catch (err) {
  console.warn("[groupsInfoRoutes] ⚠️ Auth middleware not found; route unprotected for now.");
}

router.get("/info", protect, GroupsInfoController.getGroupsWithMembersAndProposals);

module.exports = router;
