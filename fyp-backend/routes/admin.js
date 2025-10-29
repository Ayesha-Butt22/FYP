const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');
const multer = require("multer");


const upload = multer({ dest: "uploads/" });
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
        body('department').optional().isString(),
        body('specialization').optional().isString(),
        
        body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
        body('contactNumber').optional().matches(/^\+?[\d\s-]{10,15}$/).withMessage('Invalid contact number')
    ],
    validate,
    adminController.createUser
);

router.post("/upload-excel", protect, isAdmin, upload.single("file"), adminController.uploadExcelAndCreateUsers);


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

// UPDATE USER — REPLACE YEH
router.put(
    '/:id',
    protect,
    isAdmin,
    [
        body('email').optional().isEmail().withMessage('Valid email required'),
        body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
        body('contactNumber').optional().matches(/^\+?[\d\s-]{10,15}$/).withMessage('Invalid contact number')
    ],
    validate,
    adminController.updateUser
);

// DELETE USER
router.delete('/:id', protect, isAdmin, adminController.deleteUser);
router.get('/stats', protect, isAdmin, adminController.getSystemStats);
router.post('/promote/:id', protect, isAdmin, adminController.makeCoordinator);
// TOGGLE STUDENT APPROVAL  
router.patch(
  '/toggle-approval/:id',
  protect,
  isAdmin,
  adminController.toggleStudentApproval
);
module.exports = router;