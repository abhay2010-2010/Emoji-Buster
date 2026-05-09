const express = require("express");
const leaderboardRouters = express.Router();


const authMiddleware = require("../middlewares/authMiddleware");
const { getLeaderboard } = require("../controllers/leaderboardController");

leaderboardRouters.get("/leaderboard", authMiddleware, getLeaderboard);

module.exports = leaderboardRouters;
