const bcrypt = require('bcryptjs');
const User = require('../models/User');
const isValidOfficialEmail = email => /^[a-zA-Z0-9._]+@riphah\.edu\.pk$/.test(email);

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, specialization , availableSlots , bookedSlots } = req.body;

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


exports.getSupervisors = async (req, res) => {
  try {
    const list = await User.find({ role: 'supervisor' }).select('-password');
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


exports.getCoordinators = async (req, res) => {
  try {
    const list = await User.find({ role: 'coordinator' }).select('-password');
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const list = await User.find({ role: 'admin' }).select('-password');
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const list = await User.find({ role: 'student' }).select('-password');
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
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


exports.updateUser = async (req, res) => {
  try {
    const { name, email, department, specialization, password , availableSlots , bookedSlots } = req.body;
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
    if (bookedSlots) user.bookedSlots = bookedSlots;
    if (availableSlots) user.availableSlots = availableSlots;

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


exports.resetPasswordByEmail = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ error: "email and newPassword required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = true;
    user.first_login = true;

    await user.save();
    return res.json({ message: "Password reset successfully for user" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
