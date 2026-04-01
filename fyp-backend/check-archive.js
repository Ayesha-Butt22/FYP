require('dotenv').config();
const mongoose = require("mongoose");
const ArchiveProject = require("./models/ArchiveProject");

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const p = await ArchiveProject.findOne();
    if (!p) {
        console.log("No archived projects found.");
    } else {
        console.log("ArchiveProject supervisor type:", typeof p.supervisor);
        console.log("ArchiveProject supervisor value:", p.supervisor);
    }
    process.exit();
}
check();