const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const taskController = require("../controllers/taskController");

const router = express.Router();

// All routes require authentication
router.use(protect);

// Task CRUD operations
router.post("/", taskController.createTask);
router.get("/group/:groupId", taskController.getGroupTasks);
router.get("/my-tasks", taskController.getMyTasks);
router.get("/my-group", taskController.getMyGroup);  // Added for first API
router.get("/:taskId", taskController.getTaskById);
router.put("/:taskId/progress", taskController.updateTaskProgress);
router.put("/:taskId/details", taskController.updateTaskDetails);
router.post("/:taskId/comment", taskController.addComment);
router.delete("/:taskId", taskController.deleteTask);

module.exports = router;