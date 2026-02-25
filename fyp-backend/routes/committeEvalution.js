//comitteEvaluation
const express = require("express");
const router = express.Router();
const controller = require("../controllers/comitteeEvaluationController");

router.post("/submit", controller.submitEvaluation);
router.get("/", controller.getEvaluations);
router.get("/onlyApproved", controller.getApprovedEvaluations);
router.get("/student/:email", controller.getStudentEvaluations);
router.post("/approve", controller.approveEvaluation);
router.get("/group/:groupId", controller.getEvaluationByGroup);

module.exports = router;
