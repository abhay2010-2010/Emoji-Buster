const Score = require("../models/Score");
const User = require("../models/User");

const getLeaderboard = async (req, res) => {
  try {
    const game_id = Number(req.query.game_id);

    const topPlayers = await Score.find({ game_id })
      .sort({ highest_level: -1 })
      .limit(10)
      .populate("user_id", "username");

    const formattedTopPlayers = topPlayers.map((player, index) => ({
      rank: index + 1,
      username: player.user_id.username,
      level: player.highest_level
    }));

    const currentUserScore = await Score.findOne({
      user_id: req.user.id,
      game_id
    }).populate("user_id", "username");

    let currentUser = null;

    if (currentUserScore) {
      const rank =
        (await Score.countDocuments({
          game_id,
          highest_level: {
            $gt: currentUserScore.highest_level
          }
        })) + 1;

      currentUser = {
        rank,
        username: currentUserScore.user_id.username,
        level: currentUserScore.highest_level
      };
    }

    res.json({
      success: true,
      top_players: formattedTopPlayers,
      current_user: currentUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getLeaderboard
};