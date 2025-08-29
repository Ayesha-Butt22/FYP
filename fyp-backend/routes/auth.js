const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Helper: strict email and SAP ID validation
const isValidStudentEmail = email => /^[0-9]{5}@students\.riphah\.edu\.pk$/.test(email);
const isValidOfficialEmail = email => /^[a-zA-Z]+@riphah\.edu\.pk$/.test(email);
const isValidAdminEmail = email => /^[a-zA-Z]+@riphah\.edu\.pk$/.test(email);
const isValidSapId = id => /^[0-9]{5}$/.test(id);

const isStrongPassword = password => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/.test(password) && !/\s/.test(password);
};

const commonPasswords = [
  "password", "12345678", "qwerty", "abcdefgh", "student", "riphah", "admin", "letmein", "123456789", "123456"
];

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, studentId, department, specialization } = req.body;

    // Role & email checks
    if (role === 'student') {
      if (!isValidStudentEmail(email))
        return res.status(400).json({ error: "Student email must be 5 digits (e.g. 48288@students.riphah.edu.pk)" });
      if (!studentId)
        return res.status(400).json({ error: 'Student ID (SAP ID) is required' });
      if (!isValidSapId(studentId))
        return res.status(400).json({ error: 'Student ID (SAP ID) must be exactly 5 digits.' });
      const emailSapId = email.split('@')[0];
      if (studentId !== emailSapId)
        return res.status(400).json({ error: 'Student ID must match the first 5 digits of your email address.' });
      if (await User.findOne({ studentId }))
        return res.status(400).json({ error: 'Student ID (SAP ID) already exists' });
    }
    if (role === 'coordinator' || role === 'supervisor') {
      if (!isValidOfficialEmail(email))
        return res.status(400).json({ error: "Email for this role must be alphabets only (e.g. hajra@riphah.edu.pk)" });
    }
    if (role === 'admin') {
      if (!isValidAdminEmail(email))
        return res.status(400).json({ error: "Admin email must be alphabets only (e.g. admin@riphah.edu.pk)" });
    }

    // Email unique check for all roles
    if (await User.findOne({ email }))
      return res.status(400).json({ error: 'Email already registered' });

    // One coordinator per department
    if (role === 'coordinator') {
      if (await User.findOne({ role: 'coordinator', department }))
        return res.status(400).json({ error: 'Coordinator for this department already exists' });
    }

    // Password validation
    if (!password)
      return res.status(400).json({ error: 'Password is required' });
    if (!isStrongPassword(password))
      return res.status(400).json({
        error: "Password must be at least 8 characters, include uppercase, lowercase, number, special character, and have no spaces."
      });
    if (commonPasswords.includes(password.toLowerCase()))
      return res.status(400).json({ error: "Password is too common. Please choose a stronger password." });
    if (
      (role === 'student' && (password.toLowerCase().includes(studentId) || password.toLowerCase().includes(email.split('@')[0]))) ||
      (role !== 'student' && password.toLowerCase().includes(email.split('@')[0]))
    )
      return res.status(400).json({ error: "Password should not contain your email or ID." });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Save user
    const user = new User({
      email,
      password: hashed,
      role,
      studentId,
      department,
      specialization
    });
    await user.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    // Defensive email format check
    if (user.role === 'student' && !isValidStudentEmail(email))
      return res.status(400).json({ error: "Student email must be 5 digits (e.g. 48288@students.riphah.edu.pk)" });
    if ((user.role === 'coordinator' || user.role === 'supervisor' || user.role === 'admin') && !isValidOfficialEmail(email))
      return res.status(400).json({ error: "Email for this role must be alphabets only (e.g. hajra@riphah.edu.pk)" });

    // Password check
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Wrong password' });

    // JWT
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;