const User = require("../models/User");
const PresentationSchedule = require("../models/DeadlineSchedule"); // or PresentationSchedule depending on your file name

exports.checkFacultyInPublishedPanel = async (req, res) => {
  try {
    const { email } = req.body;

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

    const alreadyAssigned = await PresentationSchedule.findOne({
      isPublish: true,
      facultyPanels: user._id,
    });

    if (alreadyAssigned) {
      return res.status(200).json({
        success: true,
        message: "You are listed for panel",
        facultyId: user._id,
        scheduleId: alreadyAssigned._id,
        week: alreadyAssigned.week,
        venue: alreadyAssigned.venue,
        fypPart: alreadyAssigned.fypPart,
        data: alreadyAssigned,
      });
    }

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
