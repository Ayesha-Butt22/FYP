const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.registerStudent = async (req, res) => {
  try {
    const { name, email, password, studentId, department } = req.body;
    if (!name || !email || !password || !studentId || !department)
      return res.status(400).json({ error: "All fields are required" });

    if (await User.findOne({ email }))
      return res.status(400).json({ error: "Email already exists" });

    if (await User.findOne({ studentId }))
      return res.status(400).json({ error: "Student ID already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const student = new User({
      name,
      email,
      password: hashed,
      role: "student",
      studentId,
      department,
      IsApproved: false // not approved by default!
    });

    await student.save();
    res.status(201).json({ message: "Student registered!", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select('-password');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await User.findById(id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    student.IsApproved = true;
    await student.save();
    res.json({ message: "Student approved!", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};