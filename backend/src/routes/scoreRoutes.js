const express = require("express");
const scoreRouters = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const { submitScore } = require("../controllers/scoreController");



scoreRouters.post("/score", authMiddleware, submitScore);

module.exports = scoreRouters;