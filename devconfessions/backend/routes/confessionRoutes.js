import express from 'express';
import { 
  getConfessions, 
  createConfession, 
  likeConfession, 
  deleteConfession,
  getAllConfessionsAdmin,
  getConfessionStats 
} from '../controllers/confessionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { confessionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.get('/', getConfessions);
router.post('/', confessionLimiter, createConfession);
router.patch('/:id/like', likeConfession);

// Admin routes (protected)
router.delete('/:id', protect, deleteConfession);
router.get('/admin/all', protect, getAllConfessionsAdmin);
router.get('/stats', protect, getConfessionStats);

export default router;
