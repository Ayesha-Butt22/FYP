const User = require("../models/User");


exports.getAvailableSupervisors = async (req, res) => {
  try {
    const supervisors = await User.find({ role: "supervisor" })
      .select("name department specialization availableSlots bookedSlots");

    res.status(200).json({
      success: true,
      count: supervisors.length,
      data: supervisors,
    });
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
