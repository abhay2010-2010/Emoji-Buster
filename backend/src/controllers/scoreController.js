const Score = require("../models/Score");

const submitScore = async (req, res) => {
  try {

    console.log(req.body);
console.log(req.user);
    const { game_id, level } = req.body;

    if (!game_id || level === undefined) {
      return res.status(400).json({
        success: false,
        message: "game_id and level required"
      });
    }

    if (level < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid level"
      });
    }

    const score = await Score.findOneAndUpdate(
      {
        user_id: req.user.id,
        game_id
      },
      {
        $max: {
          highest_level: level
        }
      },
      {
        upsert: true,
        new: true
      }
    );

    res.json({
      success: true,
      score
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  submitScore
};