const express = require("express");
const { protect, isStudent } = require("../middlewares/authMiddleware");
const proposalController = require("../controllers/proposalController");

const router = express.Router();

router.post("/", protect, isStudent, proposalController.createProposal);
router.get("/:groupId", protect, isStudent, proposalController.getProposalsByGroup);

module.exports = router;