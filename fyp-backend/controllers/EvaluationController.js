const User = require("../models/User");
const PresentationSchedule = require("../models/DeadlineSchedule"); // or PresentationSchedule depending on your file name

// @desc Check if supervisor/coordinator exists and is already in a published panel
// @route POST /api/evaluation/checkFaculty
// @access Public or Protected (as you prefer)
exports.checkFacultyInPublishedPanel = async (req, res) => {
  try {
    const { email } = req.body;

    // 1️⃣ Check if user exists and is supervisor or coordinator
    const user = await User.findOne({
      email,
      role: { $in: ["supervisor", "coordinator"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or not authorized role",
      });
    }

    // 2️⃣ Check in PresentationSchedule if faculty already assigned in published panels
    const alreadyAssigned = await PresentationSchedule.findOne({
      isPublish: true,
      facultyPanels: user._id,
    });

    if (alreadyAssigned) {
      return res.status(200).json({
        success: true,
        message: "Faculty is already assigned in a published panel",
        facultyId: user._id,
        scheduleId: alreadyAssigned._id,
        week: alreadyAssigned.week,
        fypPart: alreadyAssigned.fypPart,
      });
    }

    // 3️⃣ Not assigned yet
    res.status(200).json({
      success: true,
      message: "Faculty is not yet assigned in any published panel",
      facultyId: user._id,
    });
  } catch (error) {
    console.error("Error in checkFacultyInPublishedPanel:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
