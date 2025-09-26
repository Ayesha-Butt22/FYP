const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String }, // ✅ Added
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'supervisor', 'coordinator', 'admin'], required: true },
  studentId: { type: String, unique: true, sparse: true },
  department: String,
  specialization: String,
  first_login: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: false },
  bookedSlots: {type: Number , default:0 },
  availableSlots: {type: Number , default:0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);