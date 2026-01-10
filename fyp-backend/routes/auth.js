// Auth Routes
const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', authController.registerStudent);

router.post('/login', authController.login);

router.post('/change-password', protect, authController.changePassword);

// Change password by email (no auth middleware)
router.post('/change-password-email', authController.changePasswordByEmail);

router.get('/user-by-email/:email', authController.getUserByEmail);






module.exports = router;
