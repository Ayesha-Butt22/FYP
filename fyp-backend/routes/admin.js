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

// ========== CREATE USER (Admin, Supervisor, Coordinator) ==========
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

// ========== EXCEL UPLOAD ==========
router.post("/upload-excel", protect, isAdmin, upload.single("file"), adminController.uploadExcelAndCreateUsers);

// ========== GET COORDINATORS ==========
router.get('/coordinators', protect, isAdmin, adminController.getCoordinators);

// ========== CREATE NEW COORDINATOR ==========
router.post('/coordinators', protect, isAdmin, adminController.createCoordinator);

// ========== UPDATE COORDINATOR ==========
router.put('/coordinators/:id', protect, isAdmin, adminController.updateCoordinator);

// ========== DELETE COORDINATOR ==========
router.delete('/coordinators/:id', protect, isAdmin, adminController.deleteCoordinator);

// ========== REMOVE COORDINATOR (convert to supervisor) ==========
router.put('/coordinators/:id/remove', protect, isAdmin, adminController.removeCoordinator);

// ========== MAKE FYP INCHARGE - COORDINATOR ==========
router.put('/coordinators/:id/make-fyp-incharge', protect, isAdmin, adminController.makeFYPIncharge);

// ========== MAKE FYP HEAD - COORDINATOR ==========
router.put('/coordinators/:id/make-fyp-head', protect, isAdmin, adminController.makeFYPHead);

// ========== GET ADMINS ==========
router.get('/alladmins', protect, isAdmin, adminController.getAdmins);

// ========== GET SUPERVISORS ==========
router.get('/supervisors', adminController.getSupervisors);

// ========== GET ALL STUDENTS for admin ==========
router.get('/students', protect, isAdmin, adminController.getAllStudents);

// ========== APPROVE STUDENT (admin action, POST with id in body) ==========
router.post('/approve-students', protect, isAdmin, adminController.approveStudent);

// ========== GET ALL USERS ==========
router.get('/all', protect, isAdmin, adminController.getAllUsers);
router.get('/all-groups', protect, isAdmin, adminController.getAllGroups);

// ========== UPDATE USER ==========
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

// ========== DELETE USER ==========
router.delete('/:id', protect, isAdmin, adminController.deleteUser);

// ========== REMOVE COORDINATOR (convert to supervisor) - PATCH ==========
router.patch('/remove-coordinator/:id', protect, isAdmin, adminController.removeCoordinator);

// ========== MAKE FYP INCHARGE - POST ==========
router.post('/make-fyp-incharge/:id', protect, isAdmin, adminController.makeFYPIncharge);

// ========== SYSTEM STATS ==========
router.get('/stats', protect, isAdmin, adminController.getSystemStats);

// ========== RECENT ACTIVITIES ==========
router.get('/get-activities', protect, isAdmin, adminController.getRecentActivities);

// ========== PROMOTE TO COORDINATOR ==========
router.post('/promote/:id', protect, isAdmin, adminController.makeCoordinator);

// ========== TOGGLE STUDENT APPROVAL ==========
router.patch(
  '/toggle-approval/:id',
  protect,
  isAdmin,
  adminController.toggleStudentApproval
);

// ========== SUPERVISOR SLOTS ==========
router.post("/supervisor/update-slots", adminController.updateSupervisorSlotsByEmail);

// ========== SUPERVISORS FOR COORDINATOR ==========
router.get("/supervisors-for-coordinator", protect, isAdmin, adminController.getSupervisorsForCoordinator);

module.exports = router;