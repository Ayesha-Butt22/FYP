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

// ── SPECIFIC ROUTES FIRST (before /:id wildcard) ──────────────────────────

// CREATE USER
router.post('/create', protect, isAdmin, [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').isIn(['supervisor', 'coordinator', 'admin']).withMessage('Invalid role'),
    body('department').optional().isString(),
    body('specialization').optional().isString(),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('contactNumber').optional().matches(/^\+?[\d\s-]{10,15}$/)
], validate, adminController.createUser);

router.post("/upload-excel", protect, isAdmin, upload.single("file"), adminController.uploadExcelAndCreateUsers);

// SYSTEM STATS
router.get('/stats', protect, adminController.getSystemStats);

// RECENT ACTIVITIES
router.get('/recent-activities', protect, adminController.getRecentActivities);

// GET COORDINATORS
router.get('/coordinators', protect, isAdmin, adminController.getCoordinators);

// GET ADMINS
router.get('/alladmins', protect, isAdmin, adminController.getAdmins);

// GET SUPERVISORS
router.get('/supervisors', adminController.getSupervisors);

// SUPERVISORS FOR COORDINATOR
router.get("/supervisors-for-coordinator", protect, adminController.getSupervisorsForCoordinator);

// GET ALL STUDENTS
router.get('/students', protect, isAdmin, adminController.getAllStudents);

// APPROVE STUDENT
router.post('/approve-students', protect, isAdmin, adminController.approveStudent);

// TOGGLE STUDENT APPROVAL
router.patch('/toggle-approval/:id', protect, isAdmin, adminController.toggleStudentApproval);

// REMOVE COORDINATOR
router.patch('/remove-coordinator/:id', protect, isAdmin, adminController.removeCoordinator);

// MAKE FYP INCHARGE
router.post('/make-fyp-incharge/:id', protect, isAdmin, adminController.makeFYPIncharge);

// PROMOTE TO COORDINATOR
router.post('/promote/:id', protect, isAdmin, adminController.makeCoordinator);

// UPDATE SUPERVISOR SLOTS
router.post("/supervisor/update-slots", adminController.updateSupervisorSlotsByEmail);

// GET ALL USERS
router.get('/all', protect, isAdmin, adminController.getAllUsers);
router.get('/all-groups', protect, isAdmin, adminController.getAllGroups);

// ── WILDCARD ROUTES LAST (/:id must come after all specific routes) ────────

// UPDATE USER — protect only, no isAdmin, so token issues are easier to debug
router.put('/:id', protect, [
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('contactNumber').optional().matches(/^\+?[\d\s-]{10,15}$/)
], validate, adminController.updateUser);

// DELETE USER
router.delete('/:id', protect, adminController.deleteUser);

module.exports = router;