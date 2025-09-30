const bcrypt = require('bcryptjs');
const User = require('../models/User');
const isValidOfficialEmail = email => /^[a-zA-Z0-9._]+@riphah\.edu\.pk$/.test(email);

// CREATE ANY USER (Admin, Supervisor, Coordinator)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, specialization, availableSlots, bookedSlots } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ error: "Name, email, password and role are required" });

    if (!["admin", "supervisor", "coordinator"].includes(role))
      return res.status(400).json({ error: "Invalid role" });

    if (!isValidOfficialEmail(email))
      return res.status(400).json({ error: "Official email invalid" });

    if (await User.findOne({ email }))
      return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashed,
      role,
      department,
      specialization,
      availableSlots,
      bookedSlots,
      mustChangePassword: true,
      first_login: true
    });

    await newUser.save();
    const u = newUser.toObject();
    delete u.password;

    return res.status(201).json({ message: `${role} created successfully`, user: u });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET COORDINATORS
exports.getCoordinators = async (req, res) => {
  try {
    const list = await User.find({ role: 'coordinator' }).select('-password');
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET ADMINS (for other modules)
exports.getAdmins = async (req, res) => {
  try {
    const list = await User.find({ role: 'admin' }).select('-password');
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET SUPERVISORS (for other modules)
exports.getSupervisors = async (req, res) => {
  try {
    const list = await User.find({ role: 'supervisor' }).select('-password');
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET ALL STUDENTS (for admin)
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select('-password');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// APPROVE STUDENT (admin action)
exports.approveStudent = async (req, res) => {
  try {
    // If using POST, student id should come in body
    const { id } = req.body;
    const student = await User.findById(id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    student.IsApproved = true;
    await student.save();
    res.json({ message: "Student approved!", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const list = await User.find({}).select('-password');
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const { name, email, department, specialization, password, availableSlots, bookedSlots } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ error: "Email already taken" });
      user.email = email;
    }

    if (name && name.trim() !== "") user.name = name;
    if (department) user.department = department;
    if (specialization) user.specialization = specialization;
    if (typeof bookedSlots !== "undefined") user.bookedSlots = bookedSlots;
    if (typeof availableSlots !== "undefined") user.availableSlots = availableSlots;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
      user.mustChangePassword = true;
      user.first_login = true;
    }

    await user.save();
    const u = user.toObject();
    delete u.password;

    return res.json({ message: "User updated successfully", user: u });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    await user.deleteOne();
    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};