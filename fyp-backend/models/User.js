const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'supervisor', 'coordinator', 'admin'], required: true },
  studentId: { type: String, unique: true, sparse: true },
  department: String,
  specialization: String,
  first_logic: { type: Boolean, default: false },
  first_login: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);