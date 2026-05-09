const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const START_LIVES = 3;
const BASE_HITS_TO_CLEAR = 6;
const KNIFE_SPEED = 520;
const KNIFE_LENGTH = 110;
const KNIFE_WIDTH = 10;
const KNIFE_MIN_ANGLE_GAP = 8;

const EMOJIS = ["😀", "😎", "🤖", "👻", "🔥", "🍕", "🚀", "🧠", "🎯", "💎"];

let emojiBusterGame;

const API_BASE_URL = "http://localhost:5000/api";

let authToken = localStorage.getItem("token");

async function submitScore(level) {
  try {

    console.log("API CALLED");

    if (!authToken) {
      console.log("NO TOKEN FOUND");
      return;
    }

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

    console.log("SCORE RESPONSE:", data);

  } catch (error) {
    console.log("Submit Score Error:", error);
  }
}

async function getLeaderboard() {

  try {

    if (!authToken) {
      console.log("NO TOKEN FOR LEADERBOARD");
      return [];
    }

    const res = await fetch(
      `${API_BASE_URL}/leaderboard?game_id=1`,
      {
        method: "GET",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const data = await res.json();

    console.log("LEADERBOARD:", data);

    // IMPORTANT FIX
    return data.top_players || [];

  } catch (err) {

    console.log("Leaderboard Error:", err);

    return [];
  }
}


class EmojiBusterScene extends Phaser.Scene {
  constructor() {
    super("EmojiBusterScene");
  }



 preload() {

  // SOUNDS
  this.load.audio("swosh", "sounds/swoosh.mp3");

  this.load.audio("knifeHit", "sounds/knifeHit.mp3");

  this.load.audio("knifeMiss", "sounds/knifeMiss.mp3");

  this.load.audio("covidBurst", "sounds/covidBurst.mp3");

  this.load.audio("knifeWin", "sounds/knifeWin.mp3");


  // PNG ASSETS
  this.load.image("background", "assets/background.png");

  this.load.image("logo", "assets/logo.png");

  this.load.image("knife", "assets/knife.png");

  this.load.image("targets", "assets/targets.png");

  this.load.image("playButton", "assets/playButton.png");

  this.load.image("replayButton", "assets/replayButton.png");

  this.load.image("heart", "assets/heart.png");

  this.load.image("heartEmpty", "assets/heartEmpty.png");

  this.load.image("loading", "assets/loading.png");

  this.load.image("socialDistancing", "assets/socialDistancing.png");

  this.load.image("solitaire", "assets/solitaire.png");

  this.load.image("knifeMarketOn", "assets/knifeMarkerOn.png");

  this.load.image("knifeMarketOff", "assets/knifeMarkerOff.png");

  this.load.image("albuLogo", "assets/albuLogo.png");

  this.load.image("second", "assets/2nd.png");

  this.load.image("favi", "assets/favi.png");
}


  create() {
    this.level = 1;
    this.score = 0;
    this.lives = START_LIVES;
    this.canThrow = true;
    this.isRoundOver = false;

    this.swoshSound = this.sound.add("swosh");

    this.hitSound = this.sound.add("knifeHit");

    this.missSound = this.sound.add("knifeMiss");

    this.burstSound = this.sound.add("covidBurst");

    this.winSound = this.sound.add("knifeWin");

    this.add.image(
  GAME_WIDTH / 2,
  GAME_HEIGHT / 2,
  "background"
).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.add.image(
  GAME_WIDTH / 2,
  60,
  "logo"
).setScale(0.4);

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

    // LEADERBOARD TITLE
    this.leaderboardTitle = this.add
      .text(GAME_WIDTH / 2, 470, "🏆 Leaderboard", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffcc66",
      })
      .setOrigin(0.5);

    // LEADERBOARD TEXT
    this.leaderboardText = this.add
      .text(GAME_WIDTH / 2, 510, "Loading...", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5);


    this.throwKnife = this.add.image(
  GAME_WIDTH / 2,
  GAME_HEIGHT - 90,
  "knife"
);

this.throwKnife.setScale(0.25);

    this.emoji = this.add.image(
  GAME_WIDTH / 2,
  250,
  "targets"
);

this.emoji.setScale(0.45);

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
    this.showLeaderboard();

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

      knife.body.x = this.targetCenter.x + this.targetRadius * Math.cos(rad);
      knife.body.y = this.targetCenter.y + this.targetRadius * Math.sin(rad);
      knife.body.angle = knife.orbitAngle;

      knife.tip.x = knife.body.x;
      knife.tip.y = knife.body.y - KNIFE_LENGTH;
      knife.tip.angle = knife.orbitAngle;
    }
  }

  tryThrowKnife() {

    if (!this.canThrow || this.isRoundOver) {
      return;
    }

    this.canThrow = false;

    // SAVE ORIGINAL POSITION
    const startX = GAME_WIDTH / 2;
    const startY = GAME_HEIGHT - 90;

    const destinationY =
      this.targetCenter.y + this.targetRadius;
    this.swoshSound.play();
    this.tweens.add({

      targets: [
        this.throwKnife,
        this.throwKnifeTip
      ],

      y: destinationY,

      duration: KNIFE_SPEED,

      ease: "Linear",

      onComplete: () => {

        const impactAngle =
          Phaser.Math.Wrap(
            this.currentRotation,
            0,
            360
          );

        if (this.willCollide(impactAngle)) {

          this.onMiss();

        } else {

          this.onHit(impactAngle);
        }

        // RESET KNIFE POSITION
        this.throwKnife.x = startX;
        this.throwKnife.y = startY;
        this.throwKnife.angle = 0;

        this.throwKnifeTip.x = startX;
        this.throwKnifeTip.y =
          startY - KNIFE_LENGTH;
        this.throwKnifeTip.angle = 0;
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

      console.log("ANGLE DIFF:", diff);

      // More balanced collision detection
      if (diff < 8) {
        return true;
      }
    }

    return false;
  }

  onHit(impactAngle) {
    this.hitSound.play();
    this.hitsDone += 1;
    this.score += 10;

    const body = this.add
      .rectangle(this.targetCenter.x, this.targetCenter.y + this.targetRadius, KNIFE_WIDTH, KNIFE_LENGTH, 0xffffff)
      .setOrigin(0.5, 1);
    const tip = this.add
      .triangle(this.targetCenter.x, this.targetCenter.y + this.targetRadius - KNIFE_LENGTH, 0, 12, 8, 0, 16, 12, 0xffffff)
      .setOrigin(0.5, 1);

    body.angle = impactAngle;
    tip.angle = impactAngle;

    this.attachedKnives.push({ body, tip, orbitAngle: impactAngle });

    if (this.hitsDone >= this.hitsRequired) {
      this.clearLevel();
      return;
    }

    this.canThrow = true;
    this.updateHud();
  }

  onMiss() {

    this.missSound.play();
    this.lives -= 1;
    this.updateHud();
    // SAVE START POSITION
    const startY = this.scale.height - 120;

    this.tweens.add({
      targets: [this.throwKnife, this.throwKnifeTip],

      x: this.throwKnife.x + 120,
      y: GAME_HEIGHT + 120,
      angle: 260,

      duration: 420,
      ease: "Cubic.easeIn",

      onComplete: () => {

        const impactAngle = Phaser.Math.Wrap(
          this.currentRotation,
          0,
          360
        );

        // TEMPORARY FORCE HIT
        this.onHit(impactAngle);

        // RESET KNIFE POSITION
        this.throwKnife.x = GAME_WIDTH / 2;
        this.throwKnife.y = startY;

        this.throwKnife.angle = 0;

        // RESET KNIFE TIP POSITION
        this.throwKnifeTip.x = GAME_WIDTH / 2;

        this.throwKnifeTip.y =
          startY - KNIFE_LENGTH;

        this.throwKnifeTip.angle = 0;
      },
    });
  }

  clearLevel() {
    this.isRoundOver = true;
    this.canThrow = false;
    this.showRoundMessage("Level cleared!");
    this.burstSound.play();
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

        console.log("LEVEL CLEARED");
        this.winSound.play();
        submitScore(this.level);

        this.showLeaderboard();

        this.hitsDone = 0;
        this.hitsRequired = BASE_HITS_TO_CLEAR + Math.min(this.level - 1, 10);
        this.rotationSpeed = Phaser.Math.Clamp(this.rotationSpeed + 16, 120, 300);
        this.emoji.setText(EMOJIS[(this.level - 1) % EMOJIS.length]);

        this.isRoundOver = false;
        this.canThrow = true;
        this.updateHud();
        this.showRoundMessage("Next level!");
      },

    });
  }

  gameOver() {
    this.isRoundOver = true;
    this.canThrow = false;
    this.showRoundMessage("Game Over");
    this.restartButton.setVisible(true);
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

  async showLeaderboard() {

    const players = await getLeaderboard();

    if (!players.length) {

      this.leaderboardText.setText(
        "Failed to load leaderboard"
      );

      this.leaderboardText.setVisible(true);

      return;
    }


    let text = "🏆 LEADERBOARD 🏆\n\n";

    players.forEach((p, i) => {

      text += `${i + 1}. ${p.username} - Level ${p.highest_level}\n`;

    });

    this.leaderboardText.setText(text);

    this.leaderboardText.setVisible(true);

    this.time.delayedCall(4000, () => {

      this.leaderboardText.setVisible(false);

    });
  }
}

async function loginUser() {
  try {

    const username =
      document.getElementById("username").value;

    const mobile_number =
      document.getElementById("mobile").value;

    const response = await fetch(
      `${API_BASE_URL}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          mobile_number,
        }),
      }
    );

    const data = await response.json();

    console.log(data);

    if (data.success) {

      localStorage.setItem("token", data.token);

      authToken = data.token;

      document.getElementById(
        "login-container"
      ).style.display = "none";

      alert("Login Success");
    }

  } catch (error) {
    console.log(error);
  }
}



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

  if (!authToken) {
    document.getElementById("login-container").style.display = "flex";
  } else {
    document.getElementById("login-container").style.display = "none";
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