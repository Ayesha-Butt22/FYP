const express = require("express");
const router = express.Router();
const {
    createOrUpdatePresentation,
    createOrUpdatePresentationBatch,
    getPresentation,
    bookSlot,
    getFaculty,
    checkSlot,
} = require("../controllers/deadlineScheduleController");


router.post("/create", createOrUpdatePresentation);
router.post("/createBatch", createOrUpdatePresentationBatch);

router.get("/get", getPresentation);
router.get("/getSlots/:email", checkSlot);
router.get("/getfaculty", getFaculty);

router.post("/book", bookSlot);

module.exports = router;