import Confession from '../models/Confession.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get all confessions with pagination, filtering, and sorting
// @route   GET /api/confessions
// @access  Public
export const getConfessions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = { status: 'active' };
  
  // Filter by tag
  if (req.query.tag) {
    filter.tags = req.query.tag;
  }

  // Sorting options
  let sort = { createdAt: -1 }; // Default: newest first
  if (req.query.sort === 'top') {
    sort = { likes: -1 };
  }

  const confessions = await Confession.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Confession.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: confessions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Create a new confession
// @route   POST /api/confessions
// @access  Public
export const createConfession = asyncHandler(async (req, res) => {
  const { text, tags } = req.body;

  // Get client IP for rate limiting and like tracking
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

  // Create confession
  const confession = await Confession.create({
    text,
    tags: tags || [],
    likedIPs: [clientIP] // Add creator IP (they can't like their own)
  });

  res.status(201).json({
    success: true,
    data: confession
  });
});

// @desc    Like a confession
// @route   PATCH /api/confessions/:id/like
// @access  Public
export const likeConfession = asyncHandler(async (req, res) => {
  const confession = await Confession.findById(req.params.id);

  if (!confession) {
    return res.status(404).json({
      success: false,
      message: 'Confession not found'
    });
  }

  if (confession.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Confession has been removed'
    });
  }

  // Get client IP
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

  // Check if IP already liked
  if (confession.likedIPs.includes(clientIP)) {
    return res.status(400).json({
      success: false,
      message: 'You have already liked this confession'
    });
  }

  // Add like
  confession.likes += 1;
  confession.likedIPs.push(clientIP);
  await confession.save();

  res.status(200).json({
    success: true,
    data: {
      likes: confession.likes
    }
  });
});

// @desc    Delete (soft) a confession
// @route   DELETE /api/confessions/:id
// @access  Private (Admin)
export const deleteConfession = asyncHandler(async (req, res) => {
  const confession = await Confession.findById(req.params.id);

  if (!confession) {
    return res.status(404).json({
      success: false,
      message: 'Confession not found'
    });
  }

  // Soft delete - change status
  confession.status = 'removed';
  await confession.save();

  res.status(200).json({
    success: true,
    message: 'Confession removed successfully'
  });
});

// @desc    Get all confessions (including removed) - Admin view
// @route   GET /api/confessions/admin/all
// @access  Private (Admin)
export const getAllConfessionsAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const confessions = await Confession.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Confession.countDocuments();

  res.status(200).json({
    success: true,
    data: confessions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get confession statistics
// @route   GET /api/confessions/stats
// @access  Private (Admin)
export const getConfessionStats = asyncHandler(async (req, res) => {
  const total = await Confession.countDocuments({ status: 'active' });
  const removed = await Confession.countDocuments({ status: 'removed' });
  const totalLikes = await Confession.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: null, totalLikes: { $sum: '$likes' } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      removed,
      totalLikes: totalLikes[0]?.totalLikes || 0
    }
  });
});
