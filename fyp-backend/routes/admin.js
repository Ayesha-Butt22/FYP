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

router.post(
    '/create',
    protect,
    isAdmin,
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('role').isIn(['supervisor', 'coordinator', 'admin']).withMessage('Role must be supervisor, coordinator, or admin'),
        body('department').optional().isString().withMessage('Department must be string'),
    ],
    validate,
    adminController.createUser
);

router.get('/supervisors', protect, isAdmin, adminController.getSupervisors);
router.get('/coordinators', protect, isAdmin, adminController.getCoordinators);
router.get('/alladmins', protect, isAdmin, adminController.getAdmins);
router.get('/students', protect, isAdmin, adminController.getStudents);

router.get('/all', protect, isAdmin, adminController.getAllUsers);

router.put(
    '/:id',
    protect,
    isAdmin,
    [
        body('email').optional().isEmail().withMessage('Valid email required'),
    ],
    validate,
    adminController.updateUser
);
router.delete('/:id', protect, isAdmin, adminController.deleteUser);


router.post(
    '/reset-password',
    protect,
    isAdmin,
    [body('email').isEmail().withMessage('Valid email is required')],
    validate,
    adminController.resetPasswordByEmail
);

module.exports = router;
