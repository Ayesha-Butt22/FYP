const express = require("express");
const router = express.Router();
const { getFYPJournal } = require("../controllers/journalController");

router.get("/", getFYPJournal);

module.exports = router;
