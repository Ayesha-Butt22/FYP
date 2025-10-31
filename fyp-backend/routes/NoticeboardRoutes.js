const express = require("express");
const router = express.Router();
const controller = require("../controllers/NoticeboardController");

// ✅ CRUD routes
router.get("/", controller.getAllNotices);
router.post("/", controller.createNotice);
router.put("/:id", controller.updateNotice);
router.delete("/:id", controller.deleteNotice);

module.exports = router;
