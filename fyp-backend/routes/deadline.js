const express = require('express');
const deadlineController = require('../controllers/deadlineController');

const router = express.Router();

router.get('/getdeadline', deadlineController.getDeadLine);


module.exports = router;