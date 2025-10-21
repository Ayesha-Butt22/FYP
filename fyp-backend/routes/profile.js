const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads/profilepic");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const email = (req.body.email || "unknown").replace(/[^a-zA-Z0-9]/g, "_");
        const ext = path.extname(file.originalname) || ".jpg";
        cb(null, `${email}${ext}`);
    },
});

const upload = multer({ storage });

router.post("/upload", upload.single("profilePic"), (req, res) => {
    if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

    res.json({
        message: "Profile picture uploaded successfully",
        fileName: req.file.filename,
        path: `/api/profile-pic/${req.body.email}`,
    });
});

router.get("/:email", (req, res) => {
    const email = req.params.email.replace(/[^a-zA-Z0-9]/g, "_");
    const extensions = [".jpg", ".jpeg", ".png", ".webp"];

    for (const ext of extensions) {
        const filePath = path.join(uploadDir, `${email}${ext}`);
        if (fs.existsSync(filePath)) {
            const mimeType = mime.lookup(ext) || "image/jpeg";
            res.setHeader("Content-Type", mimeType);
            return res.sendFile(filePath);
        }
    }

    res.status(404).json({ message: "Profile picture not found" });
});

module.exports = router;
