import Admin from '../models/Admin.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import generateToken from '../utils/generateToken.js';

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for admin email
  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if password matches
  const isMatch = await admin.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate token
  const token = generateToken(admin._id);

  res.status(200).json({
    success: true,
    token,
    data: {
      id: admin._id,
      email: admin.email
    }
  });
});

// @desc    Get current admin profile
// @route   GET /api/admin/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id);
  
  res.status(200).json({
    success: true,
    data: admin
  });
});

// @desc    Create admin (first time setup or seed)
// @route   POST /api/admin/register
// @access  Public (can be restricted in production)
export const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if admin exists
  const adminExists = await Admin.findOne({ email });

  if (adminExists) {
    return res.status(400).json({
      success: false,
      message: 'Admin already exists'
    });
  }

  // Create admin
  const admin = await Admin.create({
    email,
    password
  });

  if (admin) {
    const token = generateToken(admin._id);
    
    res.status(201).json({
      success: true,
      token,
      data: {
        id: admin._id,
        email: admin.email
      }
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid admin data'
    });
  }
});

// @desc    Update admin password
// @route   PUT /api/admin/password
// @access  Private
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const admin = await Admin.findById(req.admin._id).select('+password');

  // Check current password
  const isMatch = await admin.matchPassword(currentPassword);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  admin.password = newPassword;
  await admin.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});
