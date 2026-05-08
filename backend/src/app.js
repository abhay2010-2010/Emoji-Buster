const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const scoreRouters = require("./routes/scoreRoutes");
const leaderboardRouters = require("./routes/leaderboardRoutes");


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", scoreRouters);
app.use("/api", leaderboardRouters);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Emoji Buster Backend Running"
  });
});

module.exports = app;