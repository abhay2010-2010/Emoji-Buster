const jwt = require("jsonwebtoken");
const { userModel } = require("../models/User");



const login = async (req, res) => {
  try {
    const { username, mobile_number } = req.body;

    if (!username || !mobile_number) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    let user = await userModel.findOne({ mobile_number });

    if (!user) {
      user = await userModel.create({
        username,
        mobile_number
      });
    }

    const token = jwt.sign(
      {
        id: user._id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  login
};