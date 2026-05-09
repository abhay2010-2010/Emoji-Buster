const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true
    },

    mobile_number: {
      type: String,
      required: true,
      unique: true
    }
  },
  {
    timestamps: true
  }
);

const userModel = mongoose.model("User", userSchema);

module.exports = { userModel };