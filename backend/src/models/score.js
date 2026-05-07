const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    game_id: {
      type: Number,
      required: true
    },

    highest_level: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

scoreSchema.index({
  game_id: 1,
  highest_level: -1
});

module.exports = mongoose.model("Score", scoreSchema);