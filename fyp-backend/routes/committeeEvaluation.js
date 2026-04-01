// committeeEvaluationRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/committeeEvaluationController");
const evaluationController = require("../controllers/EvaluationController");

router.post("/submit", controller.submitEvaluation);
router.get("/", controller.getEvaluations);
router.get("/onlyApproved", controller.getApprovedEvaluations);
router.get("/student/:email", controller.getStudentEvaluations);
router.post("/approve", controller.approveEvaluation);
router.get("/group/:groupId", controller.getEvaluationByGroup);
router.get("/my-submissions/:facultyId", controller.getMySubmissions);
router.post("/resolve-final-evaluation", evaluationController.resolveFinalEvaluationType);

module.exports = router;
