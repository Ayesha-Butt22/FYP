// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'supervisor', 'coordinator', 'admin'], 
    required: true 
  },
  studentId: { type: String, unique: true, sparse: true },
  department: String,
  specialization: String,
  first_login: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: false },
  bookedSlots: { type: Number, default: 0 },
  availableSlots: { type: Number, default: 0 },
  IsApproved: { type: Boolean, default: true },
  designation: { type: String, default: null },
  isGroupMade: { type: Boolean, default: false },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'], 
    default: null 
  },
  contactNumber: { 
    type: String,
    match: [/^\+?[\d\s-]{10,15}$/, 'Invalid contact number format'],
    default: null 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);