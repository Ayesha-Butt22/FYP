//models/SemesterStartDate.js
const mongoose = require("mongoose");

const semesterStartDateSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SemesterStartDate",
  semesterStartDateSchema
);
