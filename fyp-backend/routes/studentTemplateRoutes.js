const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { uploadTemplate, getGroupTemplates } = require("../controllers/studentTemplateController");

const router = express.Router();

// ---------------- STORAGE ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/templates";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// POST upload template
router.post("/upload", upload.single("file"), uploadTemplate);

// GET group templates
router.get("/group/:groupId", getGroupTemplates);

module.exports = router;
