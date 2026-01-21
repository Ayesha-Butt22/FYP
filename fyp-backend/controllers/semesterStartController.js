const SemesterStartDate = require("../models/SemesterStartDate");

/* ================= READ ================= */
exports.getSemesterStartDate = async (req, res) => {
  try {
    const record = await SemesterStartDate.findOne();
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE ================= */
exports.updateSemesterStartDate = async (req, res) => {
  try {
    const { date } = req.body;

    let record = await SemesterStartDate.findOne();

    if (!record) {
      record = await SemesterStartDate.create({ date });
    } else {
      record.date = date;
      await record.save();
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
