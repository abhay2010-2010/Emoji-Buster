const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { submitScore } = require("../controllers/scoreController");

router.post("/score", authMiddleware, submitScore);

module.exports = router;