const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getLeaderboard
} = require("../controllers/leaderboardController");

router.get("/leaderboard", authMiddleware, getLeaderboard);

module.exports = router;