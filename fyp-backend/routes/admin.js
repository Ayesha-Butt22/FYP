const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 🟢 admin-only endpoints
router.post(
  '/create',
  protect,
  isAdmin,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('role')
      .isIn(['supervisor', 'coordinator', 'student'])
      .withMessage('Role must be supervisor, coordinator, or student'),
    body('department')
      .optional()
      .isString()
      .withMessage('Department must be string'),
  ],
  validate,
  adminController.createUser
);

// 🟢 supervisors / coordinators
router.get('/supervisors', protect, isAdmin, adminController.getSupervisors);
router.get('/coordinators', protect, isAdmin, adminController.getCoordinators);

// 🟢 generic/all users
router.get('/all', protect, isAdmin, adminController.getAllUsers);

// 🟢 update / delete by id
router.put(
  '/:id',
  protect,
  isAdmin,
  [
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('role')
      .optional()
      .isIn(['supervisor', 'coordinator', 'student', 'admin'])
      .withMessage('Invalid role'),
  ],
  validate,
  adminController.updateUser
);

router.delete('/:id', protect, isAdmin, adminController.deleteUser);

// 🟢 admin reset by email
router.post(
  '/reset-password',
  protect,
  isAdmin,
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  adminController.resetPasswordByEmail
);

module.exports = router;
