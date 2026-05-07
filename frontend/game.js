const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const START_LIVES = 3;
const BASE_HITS_TO_CLEAR = 6;
const KNIFE_SPEED = 520;
const KNIFE_LENGTH = 110;
const KNIFE_WIDTH = 10;
const KNIFE_MIN_ANGLE_GAP = 16;

const EMOJIS = ["😀", "😎", "🤖", "👻", "🔥", "🍕", "🚀", "🧠", "🎯", "💎"];

let emojiBusterGame;

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
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 90, KNIFE_WIDTH, KNIFE_LENGTH, 0xffffff)
      .setOrigin(0.5, 1);

    this.throwKnifeTip = this.add
      .triangle(GAME_WIDTH / 2, GAME_HEIGHT - 90 - KNIFE_LENGTH, 0, 12, 8, 0, 16, 12, 0xffffff)
      .setOrigin(0.5, 1);

    this.emoji = this.add
      .text(GAME_WIDTH / 2, 250, EMOJIS[0], {
        fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
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

      knife.body.x = this.targetCenter.x + this.targetRadius * Math.cos(rad);
      knife.body.y = this.targetCenter.y + this.targetRadius * Math.sin(rad);
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
        const impactAngle = Phaser.Math.Wrap(this.currentRotation, 0, 360);
        if (this.willCollide(impactAngle)) this.onMiss();
        else this.onHit(impactAngle);

        this.throwKnife.y = startY;
        this.throwKnifeTip.y = startY - KNIFE_LENGTH;
      },
    });
  }

  willCollide(testAngle) {
    for (const knife of this.attachedKnives) {
      const diff = Math.abs(Phaser.Math.Angle.ShortestBetween(testAngle, knife.orbitAngle));
      if (diff < KNIFE_MIN_ANGLE_GAP) return true;
    }
    return false;
  }

  onHit(impactAngle) {
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
        this.throwKnifeTip.y = GAME_HEIGHT - 90 - KNIFE_LENGTH;
        this.throwKnifeTip.angle = 0;

        if (this.lives <= 0) this.gameOver();
        else {
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
      onComplete: () => {
        for (const knife of this.attachedKnives) {
          knife.body.destroy();
          knife.tip.destroy();
        }
        this.attachedKnives = [];

        this.level += 1;
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

  emojiBusterGame = new Phaser.Game(config);

  if (emojiBusterGame.canvas) {
    emojiBusterGame.canvas.style.imageRendering = "pixelated";
    emojiBusterGame.canvas.style.touchAction = "none";
  }
  if (emojiBusterGame.context) {
    emojiBusterGame.context.imageSmoothingEnabled = false;
  }
};
