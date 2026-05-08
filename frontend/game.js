const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const START_LIVES = 3;
const BASE_HITS_TO_CLEAR = 6;
const KNIFE_SPEED = 520;
const KNIFE_LENGTH = 110;
const KNIFE_WIDTH = 10;
const KNIFE_MIN_ANGLE_GAP = 16;

const EMOJIS = [
  "😀",
  "😎",
  "🤖",
  "👻",
  "🔥",
  "🍕",
  "🚀",
  "🧠",
  "🎯",
  "💎",
];

const API_BASE_URL = "http://localhost:5000/api";

// storing token from backend
let authToken = localStorage.getItem("token");

let emojiBusterGame;

// ====================== API FUNCTIONS ======================

// Login API
async function loginUser() {
  try {
    const username = document.getElementById("username").value;
    const mobile_number = document.getElementById("mobile").value;

    if (!username || !mobile_number) {
      alert("Please fill all fields");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        mobile_number,
      }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("token", data.token);

      authToken = data.token;

      document.getElementById("login-container").style.display = "none";

      alert("Login Successful");
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.log(error);

    alert("Login Failed");
  }
}

// Submit score API
async function submitScore(level) {
  try {
    if (!authToken) return;

    const response = await fetch(`${API_BASE_URL}/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        game_id: 1,
        level,
      }),
    });

    const data = await response.json();

    console.log("Score Submitted:", data);
  } catch (error) {
    console.log("Submit Score Error:", error);
  }
}

// Fetch leaderboard API
async function fetchLeaderboard() {
  try {
    if (!authToken) return null;

    const response = await fetch(
      `${API_BASE_URL}/leaderboard?game_id=1`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();

    console.log("Leaderboard:", data);

    return data;
  } catch (error) {
    console.log("Leaderboard Error:", error);
    return null;
  }
}

//  GAME CLASS 

class EmojiBusterScene extends Phaser.Scene {
  constructor() {
    super("EmojiBusterScene");
  }

  create() {
    this.level = 1;
    this.score = 0;
    this.lives = START_LIVES;
    this.canThrow = true;
    this.isRoundOver = false;

    this.cameras.main.setBackgroundColor("#101419");

    this.titleText = this.add
      .text(GAME_WIDTH / 2, 36, "Emoji Buster", {
        fontFamily: "Arial",
        fontSize: "34px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.hudText = this.add
      .text(GAME_WIDTH / 2, 86, "", {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#d4ff71",
      })
      .setOrigin(0.5);

    this.messageText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 140, "", {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.throwKnife = this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 90,
        KNIFE_WIDTH,
        KNIFE_LENGTH,
        0xffffff
      )
      .setOrigin(0.5, 1);

    this.throwKnifeTip = this.add
      .triangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 90 - KNIFE_LENGTH,
        0,
        12,
        8,
        0,
        16,
        12,
        0xffffff
      )
      .setOrigin(0.5, 1);

    this.emoji = this.add
      .text(GAME_WIDTH / 2, 250, EMOJIS[0], {
        fontFamily:
          "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
        fontSize: "120px",
      })
      .setOrigin(0.5);

    this.targetCenter = new Phaser.Math.Vector2(GAME_WIDTH / 2, 270);
    this.targetRadius = 82;
    this.emojiBaseY = 250;
    this.emojiDirection = 1;
    this.emojiFloatSpeed = 16;

    this.rotationSpeed = 140;
    this.currentRotation = 0;
    this.attachedKnives = [];

    this.hitsRequired = BASE_HITS_TO_CLEAR;
    this.hitsDone = 0;

    this.restartButton = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 80, "Restart", {
        fontFamily: "Arial",
        fontSize: "28px",
        color: "#ffcc66",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setVisible(false)
      .on("pointerdown", () => this.restartGame());

    this.input.on("pointerdown", () => {
      this.tryThrowKnife();
    });

    this.updateHud();
    this.showRoundMessage("Tap to throw!");
  }

  update(_, deltaMs) {
    if (this.isRoundOver) return;

    const dt = deltaMs / 1000;

    this.currentRotation += this.rotationSpeed * dt;
    this.emoji.angle = this.currentRotation;

    this.emoji.y += this.emojiDirection * this.emojiFloatSpeed * dt;

    if (this.emoji.y > this.emojiBaseY + 24) {
      this.emoji.y = this.emojiBaseY + 24;
      this.emojiDirection = -1;
    } else if (this.emoji.y < this.emojiBaseY - 24) {
      this.emoji.y = this.emojiBaseY - 24;
      this.emojiDirection = 1;
    }

    this.targetCenter.y = this.emoji.y + 20;

    for (const knife of this.attachedKnives) {
      knife.orbitAngle += this.rotationSpeed * dt;

      const rad = Phaser.Math.DegToRad(knife.orbitAngle + 90);

      knife.body.x =
        this.targetCenter.x + this.targetRadius * Math.cos(rad);

      knife.body.y =
        this.targetCenter.y + this.targetRadius * Math.sin(rad);

      knife.body.angle = knife.orbitAngle;

      knife.tip.x = knife.body.x;
      knife.tip.y = knife.body.y - KNIFE_LENGTH;
      knife.tip.angle = knife.orbitAngle;
    }
  }

  tryThrowKnife() {
    if (!this.canThrow || this.isRoundOver) return;

    this.canThrow = false;

    const startY = this.throwKnife.y;
    const destinationY = this.targetCenter.y + this.targetRadius;

    this.tweens.add({
      targets: [this.throwKnife, this.throwKnifeTip],
      y: destinationY,
      duration: KNIFE_SPEED,
      ease: "Linear",

      onComplete: () => {
        const impactAngle = Phaser.Math.Wrap(
          this.currentRotation,
          0,
          360
        );

        if (this.willCollide(impactAngle)) {
          this.onMiss();
        } else {
          this.onHit(impactAngle);
        }

        this.throwKnife.y = startY;
        this.throwKnifeTip.y = startY - KNIFE_LENGTH;
      },
    });
  }

  willCollide(testAngle) {
    for (const knife of this.attachedKnives) {
      const diff = Math.abs(
        Phaser.Math.Angle.ShortestBetween(
          testAngle,
          knife.orbitAngle
        )
      );

      if (diff < KNIFE_MIN_ANGLE_GAP) return true;
    }

    return false;
  }

  onHit(impactAngle) {
    this.hitsDone += 1;
    this.score += 10;

    const body = this.add
      .rectangle(
        this.targetCenter.x,
        this.targetCenter.y + this.targetRadius,
        KNIFE_WIDTH,
        KNIFE_LENGTH,
        0xffffff
      )
      .setOrigin(0.5, 1);

    const tip = this.add
      .triangle(
        this.targetCenter.x,
        this.targetCenter.y + this.targetRadius - KNIFE_LENGTH,
        0,
        12,
        8,
        0,
        16,
        12,
        0xffffff
      )
      .setOrigin(0.5, 1);

    body.angle = impactAngle;
    tip.angle = impactAngle;

    this.attachedKnives.push({
      body,
      tip,
      orbitAngle: impactAngle,
    });

    if (this.hitsDone >= this.hitsRequired) {
      this.clearLevel();
      return;
    }

    this.canThrow = true;
    this.updateHud();
  }

  onMiss() {
    this.lives -= 1;

    this.updateHud();

    this.tweens.add({
      targets: [this.throwKnife, this.throwKnifeTip],
      x: this.throwKnife.x + 120,
      y: GAME_HEIGHT + 120,
      angle: 260,
      duration: 420,
      ease: "Cubic.easeIn",

      onComplete: () => {
        this.throwKnife.x = GAME_WIDTH / 2;
        this.throwKnife.y = GAME_HEIGHT - 90;
        this.throwKnife.angle = 0;

        this.throwKnifeTip.x = GAME_WIDTH / 2;
        this.throwKnifeTip.y =
          GAME_HEIGHT - 90 - KNIFE_LENGTH;
        this.throwKnifeTip.angle = 0;

        if (this.lives <= 0) {
          this.gameOver();
        } else {
          this.canThrow = true;
          this.showRoundMessage("Miss! Try again");
        }
      },
    });
  }

  clearLevel() {
    this.isRoundOver = true;
    this.canThrow = false;

    this.showRoundMessage("Level cleared!");

    this.tweens.add({
      targets: this.emoji,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 220,
      yoyo: true,
      repeat: 2,

      onComplete: async () => {
        for (const knife of this.attachedKnives) {
          knife.body.destroy();
          knife.tip.destroy();
        }

        this.attachedKnives = [];

        this.level += 1;

        // submit score to backend
        await submitScore(this.level);

        this.hitsDone = 0;

        this.hitsRequired =
          BASE_HITS_TO_CLEAR + Math.min(this.level - 1, 10);

        this.rotationSpeed = Phaser.Math.Clamp(
          this.rotationSpeed + 16,
          120,
          300
        );

        this.emoji.setText(
          EMOJIS[(this.level - 1) % EMOJIS.length]
        );

        this.isRoundOver = false;
        this.canThrow = true;

        this.updateHud();

        this.showRoundMessage("Next level!");
      },
    });
  }

  async gameOver() {
    this.isRoundOver = true;
    this.canThrow = false;

    this.showRoundMessage("Game Over");

    this.restartButton.setVisible(true);

    // fetch leaderboard
    const leaderboardData = await fetchLeaderboard();

    if (leaderboardData && leaderboardData.success) {
      let leaderboardText = "🏆 TOP PLAYERS\n\n";

      leaderboardData.top_players.forEach((player) => {
        leaderboardText += `#${player.rank} ${player.username} - Level ${player.level}\n`;
      });

      if (leaderboardData.current_user) {
        leaderboardText += `\nYOUR RANK: #${leaderboardData.current_user.rank}`;
      }

      this.add
        .text(
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2 + 100,
          leaderboardText,
          {
            fontFamily: "Arial",
            fontSize: "18px",
            color: "#ffffff",
            align: "center",
            backgroundColor: "#000000",
            padding: {
              x: 20,
              y: 20,
            },
          }
        )
        .setOrigin(0.5);
    }
  }

  restartGame() {
    this.scene.restart();
  }

  updateHud() {
    this.hudText.setText(
      `Level ${this.level}   Score ${this.score}   Lives ${this.lives}   Hits ${this.hitsDone}/${this.hitsRequired}`
    );
  }

  showRoundMessage(text) {
    this.messageText.setText(text);

    this.tweens.killTweensOf(this.messageText);

    this.messageText.alpha = 1;

    this.tweens.add({
      targets: this.messageText,
      alpha: 0,
      duration: 1000,
      delay: 350,
    });
  }
}

//  GAME LOAD 

window.onload = function onLoad() {
  const config = {
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#101419",
    pixelArt: true,
    antialias: false,
    roundPixels: true,

    scene: [EmojiBusterScene],

    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  // show login if token missing
  if (!authToken) {
    document.getElementById("login-container").style.display =
      "flex";
  } else {
    document.getElementById("login-container").style.display =
      "none";
  }

  emojiBusterGame = new Phaser.Game(config);

  if (emojiBusterGame.canvas) {
    emojiBusterGame.canvas.style.imageRendering = "pixelated";
    emojiBusterGame.canvas.style.touchAction = "none";
  }

  if (emojiBusterGame.context) {
    emojiBusterGame.context.imageSmoothingEnabled = false;
  }
};