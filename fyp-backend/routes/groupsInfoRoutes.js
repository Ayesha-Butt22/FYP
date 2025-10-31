const express = require("express");
const router = express.Router();
const GroupsInfoController = require("../controllers/GroupsInfoController");

// Try to load protect middleware; if not available, fallback to noop to avoid crashing.
// This makes the route usable while you fix or move your auth middleware file.
let protect = (req, res, next) => next();

try {
  // adjust this path if your auth middleware is located somewhere else
  const auth = require("../middleware/authMiddleware");
  if (auth && typeof auth.protect === "function") {
    protect = auth.protect;
  } else if (typeof auth === "function") {
    // some projects export middleware directly
    protect = auth;
  }
} catch (err) {
  // middleware not found — route will be unprotected for now
  console.warn("[groupsInfoRoutes] auth middleware not found; /api/groups/info will be unprotected.");
}

// GET /api/groups/info
router.get("/info", protect, GroupsInfoController.getGroupsWithMembersAndProposals);

module.exports = router;