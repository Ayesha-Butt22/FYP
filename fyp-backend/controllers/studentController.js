const User = require("../models/User");


exports.getAvailableSupervisors = async (req, res) => {
  const { spec } = req.params;
  const specs = spec
      ? spec.split(",").map((s) => s.trim())
      : [];
  const query = { role: "supervisor" };
  if (specs.length > 0) {
    query.$or = specs.map((sp) => ({
      specialization: { $regex: sp, $options: "i" },
    }));
  }
  try {
    const supervisors = await User.find(query)
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
