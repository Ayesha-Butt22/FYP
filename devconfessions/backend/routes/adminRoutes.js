import express from 'express';
import { 
  login, 
  getProfile, 
  register, 
  updatePassword 
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/password', protect, updatePassword);

export default router;
