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

// CREATE USER (Admin, Supervisor, Coordinator)
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

// GET COORDINATORS
router.get('/coordinators', protect, isAdmin, adminController.getCoordinators);

// GET ADMINS
router.get('/alladmins', protect, isAdmin, adminController.getAdmins);

// GET SUPERVISORS
router.get('/supervisors', protect, isAdmin, adminController.getSupervisors);

// GET ALL STUDENTS for admin
router.get('/students', protect, isAdmin, adminController.getAllStudents);

// APPROVE STUDENT (admin action, POST with id in body)
router.post('/approve-students', protect, isAdmin, adminController.approveStudent);

// GET ALL USERS
router.get('/all', protect, isAdmin, adminController.getAllUsers);
router.get('/all-groups',protect, isAdmin, adminController.getAllGroups);

// UPDATE USER (Admin, Supervisor, Coordinator)
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

// DELETE USER
router.delete('/:id', protect, isAdmin, adminController.deleteUser);

module.exports = router;