const express = require("express");
const router = express.Router();
const ArchiveProject = require("../models/ArchiveProject");

// @route   GET /api/archive
// @desc    Get all archived projects for public viewing
router.get("/", async (req, res) => {
    try {
        const User = require("../models/User");
        const projects = await ArchiveProject.find().sort({ archivedAt: -1 }).lean();
        
        // Fetch all supervisor names for the projects
        const supervisorEmails = [...new Set(projects.map(p => p.supervisor).filter(Boolean))];
        const users = await User.find({ email: { $in: supervisorEmails } }, "name email");
        const nameMap = users.reduce((map, u) => {
            map[u.email.toLowerCase()] = u.name;
            return map;
        }, {});

        const enriched = projects.map(p => ({
            ...p,
            supervisor: nameMap[String(p.supervisor).toLowerCase()] || p.supervisor || "—"
        }));

        res.json({ success: true, data: enriched });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;