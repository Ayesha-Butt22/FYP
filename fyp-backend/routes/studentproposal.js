// routes/studentproposal.js
const express = require("express");
const { protect, isStudent, isSupervisor } = require("../middlewares/authMiddleware");
const proposalController = require("../controllers/studentproposalController");

const router = express.Router();

// 1. Student submit kare
router.post("/submit", protect, isStudent, proposalController.createProposal);

// 2. Supervisor apne proposals dekhe
router.get("/supervisor", protect, isSupervisor, proposalController.getMyProposals);

// 3. Supervisor review kare (status + comment)
router.put("/:id/review", protect, isSupervisor, proposalController.reviewProposal);

// Existing routes (agar hain)
router.get("/:groupId", protect, isStudent, proposalController.getProposalsByGroup);

module.exports = router;