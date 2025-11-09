const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

const isValidStudentEmail = email => /^[0-9]{5}@students\.riphah\.edu\.pk$/.test(email);
const isValidOfficialEmail = email => /^[a-zA-Z0-9._]+@riphah\.edu\.pk$/.test(email);
const isValidSapId = id => /^[0-9]{5}$/.test(id);
const isStrongPassword = password => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/.test(password) && !/\s/.test(password);
};
const commonPasswords = [
  "password", "12345678", "qwerty", "abcdefgh", "student", "riphah",
  "admin", "letmein", "123456789", "123456"
];

//  Student Registration
exports.registerStudent = async (req, res) => {
  try {
    const { name, email, password, studentId, department, specialization } = req.body;
    const role = 'student';

    if (!email || !password || !studentId)
      return res.status(400).json({ error: "email, password and studentId required" });

    if (!isValidStudentEmail(email))
      return res.status(400).json({ error: "Student email must be 5 digits (e.g. 48288@students.riphah.edu.pk)" });

    if (!isValidSapId(studentId))
      return res.status(400).json({ error: 'Student ID (SAP ID) must be exactly 5 digits.' });

    const emailSapId = email.split('@')[0];
    if (studentId !== emailSapId)
      return res.status(400).json({ error: 'Student ID must match the first 5 digits of your email address.' });

    if (await User.findOne({ studentId }))
      return res.status(400).json({ error: 'Student ID (SAP ID) already exists' });

    if (await User.findOne({ email }))
      return res.status(400).json({ error: 'Email already registered' });

    if (!isStrongPassword(password))
      return res.status(400).json({ error: "Password must be min 8 chars, include upper/lower/number/special and no spaces." });

    if (commonPasswords.includes(password.toLowerCase()))
      return res.status(400).json({ error: "Password too common." });

    if (password.toLowerCase().includes(studentId) || password.toLowerCase().includes(email.split('@')[0]))
      return res.status(400).json({ error: "Password should not contain your email or ID." });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashed,
      role,
      studentId,
      department,
      specialization,
      first_login: false,
      mustChangePassword: false,
      IsApproved:false,
      isGroupMade: false,
    });

    await user.save();
    return res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Login (all roles)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email & password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    if (user.role === 'student' && !isValidStudentEmail(email))
      return res.status(400).json({ error: "Student email format invalid" });

    if (['coordinator', 'supervisor', 'admin'].includes(user.role) && !isValidOfficialEmail(email))
      return res.status(400).json({ error: "Official email format invalid" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Wrong password' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: {
        name:user.name,
        id: user._id,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        first_login: user.first_login,
        studentId: user.studentId ? user.studentId : 0,
        isGroupMade: user.isGroupMade ? user.isGroupMade : false,
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword)
      return res.status(400).json({ error: "oldPassword and newPassword required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ error: "User not found" });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ error: "Old password is incorrect" });

    if (!isStrongPassword(newPassword))
      return res.status(400).json({ error: "New password is not strong enough" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    user.first_login = false;

    await user.save();
    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
