const mongoose = require('mongoose');
require('dotenv').config();

async function checkCounts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const Group = require('./models/StudentGroup');
    const Archive = require('./models/ArchiveProject');

    const students = await User.countDocuments({ role: "student" });
    const supervisors = await User.countDocuments({ role: "supervisor" });
    const coordinators = await User.countDocuments({ role: "coordinator" });
    const totalGroups = await Group.countDocuments();
    const activeGroups = await Group.countDocuments({ isArchived: { $ne: true } });
    const archivedGroups = await Group.countDocuments({ isArchived: true });
    const archivedProjects = await Archive.countDocuments();

    console.log("Counts:");
    console.log("- Students:", students);
    console.log("- Supervisors:", supervisors);
    console.log("- Coordinators:", coordinators);
    console.log("- Total Groups (in collection):", totalGroups);
    console.log("- Active Groups:", activeGroups);
    console.log("- Archived Groups (in collection):", archivedGroups);
    console.log("- Archived Projects (in Archive collection):", archivedProjects);

    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

checkCounts();
