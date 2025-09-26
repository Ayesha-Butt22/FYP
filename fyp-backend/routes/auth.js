//fyp-backend/routes/auth.js
const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', authController.registerStudent);
router.post('/login', authController.login);
router.post('/change-password', protect, authController.changePassword);

module.exports = router;
