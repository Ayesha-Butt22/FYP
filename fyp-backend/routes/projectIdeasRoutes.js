const express = require("express");
const router = express.Router();
const projectIdeasController = require("../controllers/projectIdeasController");

// Create idea
router.post("/", projectIdeasController.createIdea);

// Get all ideas by supervisor
router.get("/supervisor/:supervisorEmail", projectIdeasController.getIdeasBySupervisor);

// Delete idea
router.delete("/:id", projectIdeasController.deleteIdea);

router.get(
  "/student/:studentEmail",
  projectIdeasController.getIdeasForStudent
);


module.exports = router;
