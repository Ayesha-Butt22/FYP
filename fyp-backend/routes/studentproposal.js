// routes/studentproposal.js
const express = require("express");
const { protect, isStudent, isSupervisor } = require("../middlewares/authMiddleware");
const proposalController = require("../controllers/studentproposalController");

const router = express.Router();


router.post("/submit", protect, isStudent, proposalController.createProposal);

router.get("/supervisor", protect, isSupervisor, proposalController.getMyProposals);



router.put("/:id/review", protect, isSupervisor, proposalController.reviewProposal);


router.get("/:groupId",  proposalController.getProposalsByGroup);

module.exports = router;