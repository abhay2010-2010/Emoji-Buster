/* ═══════════════════════════════════════════════════════════
   EMOJI BUSTER  –  Production Build
   ═══════════════════════════════════════════════════════════ */

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const START_LIVES = 3;
const BASE_HITS_TO_CLEAR = 6;
const KNIFE_THROW_MS = 180;
const KNIFE_MIN_ANGLE_GAP = 10;

const API_BASE_URL = "https://emoji-buster.onrender.com/api";
let authToken = localStorage.getItem("token");

let emojiBusterGame;

/* ─── API ─────────────────────────────────────────────────── */

async function submitScore(level) {
  try {
    if (!authToken) return;
    await fetch(`${API_BASE_URL}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ game_id: 1, level }),
    });
  } catch (e) { console.log("submitScore:", e); }
}

async function getLeaderboard() {
  try {
    if (!authToken) return [];
    const res = await fetch(`${API_BASE_URL}/leaderboard?game_id=1`, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    return data.top_players || [];
  } catch (e) { return []; }
}

/* ═══════════════════════════════════════════════════════════
   MAIN SCENE
   ═══════════════════════════════════════════════════════════ */

class EmojiBusterScene extends Phaser.Scene {
  constructor() { super("EmojiBusterScene"); }

  /* ── PRELOAD ─────────────────────────────────────────────── */
  preload() {
    this.load.audio("swosh", "sounds/swoosh.mp3");
    this.load.audio("knifeHit", "sounds/knifeHit.mp3");
    this.load.audio("knifeMiss", "sounds/knifeMiss.mp3");
    this.load.audio("covidBurst", "sounds/covidBurst.mp3");
    this.load.audio("knifeWin", "sounds/knifeWin.mp3");

    /* all original PNG names */
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
    this.load.image("knifeMarkerOn", "assets/knifeMarkerOn.png");
    this.load.image("knifeMarkerOff", "assets/knifeMarkerOff.png");
    this.load.image("albuLogo", "assets/albuLogo.png");
    this.load.image("second", "assets/2nd.png");
    this.load.image("favi", "assets/favi.png");
  }

  /* ── CREATE ──────────────────────────────────────────────── */
  create() {
    /* ── state ── */
    this.level = 1;
    this.score = 0;
    this.lives = START_LIVES;
    this.canThrow = true;
    this.isRoundOver = false;
    this.hitsRequired = BASE_HITS_TO_CLEAR;
    this.hitsDone = 0;
    this.rotationSpeed = 140;
    this.currentRotation = 0;
    this.attachedKnives = [];
    this.emojiDirection = 1;
    this.emojiFloatSpeed = 18;
    this.particles = [];

    /* ── audio ── */
    this.sfx = {
      swosh: this.sound.add("swosh", { volume: 0.7 }),
      hit: this.sound.add("knifeHit", { volume: 0.9 }),
      miss: this.sound.add("knifeMiss", { volume: 0.8 }),
      burst: this.sound.add("covidBurst", { volume: 1.0 }),
      win: this.sound.add("knifeWin", { volume: 1.0 }),
    };

    /* ── background ── */
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "background")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    /* ── top gradient overlay ── */
    const topGrad = this.add.graphics().setDepth(1);
    topGrad.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0);
    topGrad.fillRect(0, 0, GAME_WIDTH, 160);
    const botGrad = this.add.graphics().setDepth(1);
    botGrad.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.65, 0.65);
    botGrad.fillRect(0, GAME_HEIGHT - 180, GAME_WIDTH, 180);

    /* ── logo ── */
    this.logoImg = this.add.image(GAME_WIDTH / 2, 50, "logo")
      .setScale(0).setDepth(10);
    this.tweens.add({ targets: this.logoImg, scale: 0.38, duration: 650, ease: "Back.easeOut", delay: 60 });

    /* ── HUD pill background ── */
    const hudBg = this.add.graphics().setDepth(9);
    hudBg.fillStyle(0x000000, 0.4);
    hudBg.fillRoundedRect(8, 74, GAME_WIDTH - 16, 30, 10);

    /* ── HUD labels ── */
    const textCfg = { fontFamily: "'Arial Black', Arial", fontSize: "13px", color: "#d4ff71" };
    this.hudLevel = this.add.text(50, 89, "LV 1", { ...textCfg }).setOrigin(0.5).setDepth(10);
    this.hudScore = this.add.text(GAME_WIDTH / 2, 89, "0 pts", { ...textCfg, color: "#ffffff" }).setOrigin(0.5).setDepth(10);
    this.hudHits = this.add.text(GAME_WIDTH - 50, 89, `0/${this.hitsRequired}`, { ...textCfg, color: "#aaaaff" }).setOrigin(0.5).setDepth(10);

    /* ── heart lives (PNG) ── */
    this.heartIcons = [];
    for (let i = 0; i < START_LIVES; i++) {
      const hx = GAME_WIDTH / 2 - (START_LIVES - 1) * 20 + i * 40;
      const h = this.add.image(hx, 118, "heart").setScale(0.065).setDepth(10);
      this.heartIcons.push(h);
    }

    /* ── knife hit markers (PNG knifeMarkerOn / knifeMarkerOff) ── */
    this.knifeMarkers = [];
    this._rebuildMarkers();

    /* ── glow ring (drawn graphics, behind target) ── */
    this.glowRing = this.add.graphics().setDepth(7);

    /* ── target ── */
    this.targetCenter = new Phaser.Math.Vector2(GAME_WIDTH / 2, 278);
    this.targetRadius = 84;
    this.emojiBaseY = 258;
    this.emoji = this.add.image(GAME_WIDTH / 2, this.emojiBaseY, "targets")
      .setScale(0).setDepth(8);
    this.tweens.add({ targets: this.emoji, scale: 0.46, duration: 700, ease: "Back.easeOut", delay: 180 });

    /* ── throwable knife (PNG) ── */
    // origin at bottom-center (handle grip) so setY moves from handle up
    this.throwKnife = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 80, "knife")
      .setScale(0.28).setOrigin(0.5, 1).setDepth(15);

    /* ── particle layer ── */
    this.particleGfx = this.add.graphics().setDepth(20);

    /* ── message banner ── */
    this.messageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 165, "", {
      fontFamily: "'Arial Black', Arial",
      fontSize: "26px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
      align: "center",
    }).setOrigin(0.5).setAlpha(0).setDepth(26);

    /* ── leaderboard panel ── */
    this.lbPanelGfx = this.add.graphics().setDepth(30).setAlpha(0);
    this.lbTitle = this.add.text(GAME_WIDTH / 2, 476, "🏆  LEADERBOARD", {
      fontFamily: "'Arial Black', Arial", fontSize: "16px", color: "#ffcc66",
    }).setOrigin(0.5).setDepth(31).setAlpha(0);
    this.lbText = this.add.text(GAME_WIDTH / 2, 535, "", {
      fontFamily: "Arial", fontSize: "14px", color: "#ffffff",
      align: "center", lineSpacing: 5,
    }).setOrigin(0.5).setDepth(31).setAlpha(0);

    /* ── replay button (PNG) ── */
    this.replayBtn = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, "replayButton")
      .setScale(0.32).setDepth(40).setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.restartGame())

      .on("pointerover", () =>
        this.tweens.add({
          targets: this.replayBtn,
          scale: 0.14,
          duration: 100
        })
      )
      .on("pointerout", () =>
        this.tweens.add({
          targets: this.replayBtn,
          scale: 0.12,
          duration: 100
        })
      );

    /* ── input ── */
    this.input.on("pointerdown", () => this.tryThrowKnife());

    /* ── init ── */
    this.updateHud();
    this.showBanner("TAP TO THROW  🔪", "#d4ff71");
    this.showLeaderboard();
  }

  /* ═══════════════════════════════════════════
     UPDATE LOOP
  ═══════════════════════════════════════════ */
  update(_, deltaMs) {
    const dt = deltaMs / 1000;

    /* glow ring pulse (always) */
    const pulse = 0.7 + 0.3 * Math.sin(this.time.now / 420);
    this._drawGlowRing(pulse);

    if (this.isRoundOver) {
      this._tickParticles(dt);
      return;
    }

    /* rotate target */
    this.currentRotation += this.rotationSpeed * dt;
    this.emoji.angle = this.currentRotation;

    /* float */
    this.emoji.y += this.emojiDirection * this.emojiFloatSpeed * dt;
    if (this.emoji.y > this.emojiBaseY + 22) {
      this.emoji.y = this.emojiBaseY + 22; this.emojiDirection = -1;
    } else if (this.emoji.y < this.emojiBaseY - 22) {
      this.emoji.y = this.emojiBaseY - 22; this.emojiDirection = 1;
    }
    this.targetCenter.y = this.emoji.y + 20;

    /* orbit stuck knives (PNG images) */
    for (const k of this.attachedKnives) {
      k.orbitAngle += this.rotationSpeed * dt;
      const rad = Phaser.Math.DegToRad(k.orbitAngle - 90);
      k.img.x = this.targetCenter.x + this.targetRadius * Math.cos(rad);
      k.img.y = this.targetCenter.y + this.targetRadius * Math.sin(rad);
      k.img.angle = k.orbitAngle;
    }

    this._tickParticles(dt);
  }

  /* ═══════════════════════════════════════════
     THROW
  ═══════════════════════════════════════════ */
  tryThrowKnife() {
    if (!this.canThrow || this.isRoundOver) return;
    this.canThrow = false;
    this.sfx.swosh.play();

    /* anticipation squeeze */
    this.tweens.add({
      targets: this.throwKnife,
      scaleX: 0.19, scaleY: 0.35,
      duration: 55, yoyo: true,
    });

    const startY = GAME_HEIGHT - 80;
    const destY = this.targetCenter.y + this.targetRadius + 8;

    this.tweens.add({
      targets: this.throwKnife,
      y: destY,
      duration: KNIFE_THROW_MS,
      ease: "Cubic.easeIn",
      onComplete: () => {
        const impactAngle = Phaser.Math.Wrap(this.currentRotation, 0, 360);
        /* reset knife back to rest */
        this.throwKnife.setPosition(GAME_WIDTH / 2, startY).setAngle(0).setScale(0.28);

        if (this.willCollide(impactAngle)) {
          this.onMiss();
        } else {
          this.onHit(impactAngle);
        }
      },
    });
  }

  willCollide(testAngle) {
    for (const k of this.attachedKnives) {
      const diff = Math.abs(Phaser.Math.Angle.ShortestBetween(testAngle, k.orbitAngle));
      if (diff < KNIFE_MIN_ANGLE_GAP) return true;
    }
    return false;
  }

  /* ═══════════════════════════════════════════
     ON HIT
  ═══════════════════════════════════════════ */
  onHit(impactAngle) {
    this.sfx.hit.play();
    this.hitsDone += 1;
    this.score += 10;

    /* place knife PNG at orbit position */
    const rad = Phaser.Math.DegToRad(impactAngle - 90);
    const kx = this.targetCenter.x + this.targetRadius * Math.cos(rad);
    const ky = this.targetCenter.y + this.targetRadius * Math.sin(rad);
    const img = this.add.image(kx, ky, "knife")
      .setScale(0).setAngle(impactAngle).setOrigin(0.5, 1).setDepth(12);

    /* pop-in */
    this.tweens.add({ targets: img, scale: 0.22, duration: 130, ease: "Back.easeOut" });

    this.attachedKnives.push({ img, orbitAngle: impactAngle });

    /* update marker */
    this._updateMarker(this.hitsDone - 1, true);

    /* particles + micro-shake */
    this._spawnHitParticles(kx, ky, 0xd4ff71);
    this._shake(3, 80);

    if (this.hitsDone >= this.hitsRequired) {
      this.clearLevel();
      return;
    }

    this.canThrow = true;
    this.updateHud();
  }

  /* ═══════════════════════════════════════════
     ON MISS
  ═══════════════════════════════════════════ */
  onMiss() {
    this.sfx.miss.play();
    this.lives -= 1;
    this.updateHud();
    this.updateHearts();

    this._flashScreen(0xff2222, 0.42, 220);
    this._shake(8, 200);

    if (this.lives <= 0) {
      this.gameOver();
      return;
    }

    this.showBanner(`💔  ${this.lives} ${this.lives === 1 ? "LIFE" : "LIVES"} LEFT`, "#ff5566");
    this.canThrow = true;
  }

  /* ═══════════════════════════════════════════
     CLEAR LEVEL
  ═══════════════════════════════════════════ */
  clearLevel() {
    this.isRoundOver = true;
    this.canThrow = false;
    this.sfx.burst.play();

    this._spawnBurstParticles(this.targetCenter.x, this.targetCenter.y);
    this._flashScreen(0xffd700, 0.45, 280);
    this._shake(9, 240);
    this.showBanner("✅  CLEARED!", "#00ff99");

    /* target burst bounce */
    this.tweens.add({
      targets: this.emoji,
      scaleX: 0.68, scaleY: 0.68,
      duration: 150, yoyo: true, repeat: 3, ease: "Sine.easeInOut",
      onComplete: async () => {
        for (const k of this.attachedKnives) k.img.destroy();
        this.attachedKnives = [];

        this.level += 1;
        this.hitsDone = 0;
        this.hitsRequired = BASE_HITS_TO_CLEAR + Math.min(this.level - 1, 10);
        this.rotationSpeed = Phaser.Math.Clamp(this.rotationSpeed + 18, 120, 320);

        this.sfx.win.play();
        submitScore(this.level);
        this.showLeaderboard();
        this._rebuildMarkers();

        this.isRoundOver = false;
        this.canThrow = true;

        
        this.updateHud();
        this.showBanner(`🚀  LEVEL ${this.level}`, "#d4ff71");
      },
    });
  }

  /* ═══════════════════════════════════════════
     GAME OVER
  ═══════════════════════════════════════════ */
  gameOver() {
    this.isRoundOver = true;
    this.canThrow = false;

    /* dim overlay */
    const ov = this.add.graphics().setDepth(35).setAlpha(0);
    ov.fillStyle(0x000000, 0.78);
    ov.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.tweens.add({ targets: ov, alpha: 1, duration: 480 });

    /* card */
    const cy = GAME_HEIGHT / 2 - 100;
    const card = this.add.graphics().setDepth(36).setAlpha(0);
    card.fillStyle(0x111a28, 1);
    card.fillRoundedRect(35, cy, GAME_WIDTH - 70, 210, 20);
    card.lineStyle(2, 0xd4ff71, 1);
    card.strokeRoundedRect(35, cy, GAME_WIDTH - 70, 210, 20);
    this.tweens.add({ targets: card, alpha: 1, duration: 350, delay: 160 });

    const tCfg = { fontFamily: "'Arial Black', Arial", align: "center" };
    const t1 = this.add.text(GAME_WIDTH / 2, cy + 38, "💀  GAME OVER", { ...tCfg, fontSize: "24px", color: "#ff4455" }).setOrigin(0.5).setDepth(37).setAlpha(0);
    const t2 = this.add.text(GAME_WIDTH / 2, cy + 82, `Level Reached: ${this.level}`, { ...tCfg, fontSize: "17px", color: "#cccccc" }).setOrigin(0.5).setDepth(37).setAlpha(0);
    const t3 = this.add.text(GAME_WIDTH / 2, cy + 116, `Score: ${this.score}`, { ...tCfg, fontSize: "22px", color: "#d4ff71" }).setOrigin(0.5).setDepth(37).setAlpha(0);

    [t1, t2, t3].forEach((t, i) =>
      this.tweens.add({ targets: t, alpha: 1, duration: 320, delay: 280 + i * 120 })
    );

    /* replay button PNG */
    const isMobile = window.innerWidth < 500;

    this.replayBtn
      .setVisible(true)
      .setAlpha(0)
      .setScale(0.08) // very small initial size
      .setPosition(GAME_WIDTH / 2, cy + 210) // move lower
      .setDepth(40);

    this.tweens.add({
      targets: this.replayBtn,
      alpha: 1,
      scale: 0.12, // FINAL SMALL SIZE
      duration: 380,
      delay: 680,
      ease: "Back.easeOut"
    });

    /* idle bob */
    this.time.delayedCall(1200, () => {
      this.tweens.add({
        targets: this.replayBtn, y: cy + 180,
        duration: 950, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
      });
    });
  }

  restartGame() { this.scene.restart(); }

  /* ═══════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════ */
  updateHud() {
    this.hudLevel.setText(`LV ${this.level}`);
    this.hudScore.setText(`${this.score} pts`);
    this.hudHits.setText(`${this.hitsDone}/${this.hitsRequired}`);
    /* score pop */
    this.tweens.add({ targets: this.hudScore, scale: 1.35, duration: 80, yoyo: true });
  }

  updateHearts() {
    for (let i = 0; i < this.heartIcons.length; i++) {
      const wasHeart = this.heartIcons[i].texture.key === "heart";
      const isHeart = i < this.lives;
      this.heartIcons[i].setTexture(isHeart ? "heart" : "heartEmpty");

      if (wasHeart && !isHeart) {
        /* shake the lost heart */
        const origX = this.heartIcons[i].x;
        this.tweens.add({
          targets: this.heartIcons[i], x: origX + 5,
          duration: 35, yoyo: true, repeat: 6,
          onComplete: () => { this.heartIcons[i].x = origX; },
        });
      }
    }
  }

  /* ═══════════════════════════════════════════
     BANNER
  ═══════════════════════════════════════════ */
  showBanner(text, color) {
    this.tweens.killTweensOf(this.messageText);
    this.messageText.setText(text).setColor(color).setAlpha(1).setScale(0.5).setDepth(26);
    this.tweens.add({ targets: this.messageText, scale: 1, duration: 200, ease: "Back.easeOut" });
    this.tweens.add({ targets: this.messageText, alpha: 0, duration: 550, delay: 950 });
  }

  /* ═══════════════════════════════════════════
     LEADERBOARD
  ═══════════════════════════════════════════ */
  async showLeaderboard() {
    this.lbPanelGfx.clear().setAlpha(0);
    this.lbTitle.setAlpha(0);
    this.lbText.setAlpha(0).setText("Loading…");

    this.lbPanelGfx.fillStyle(0x0c1422, 0.92);
    this.lbPanelGfx.fillRoundedRect(18, 452, GAME_WIDTH - 36, 162, 16);
    this.lbPanelGfx.lineStyle(1.5, 0xffcc66, 0.75);
    this.lbPanelGfx.strokeRoundedRect(18, 452, GAME_WIDTH - 36, 162, 16);

    this.tweens.add({ targets: [this.lbPanelGfx, this.lbTitle, this.lbText], alpha: 1, duration: 350 });

    const players = await getLeaderboard();
    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

    this.lbText.setText(
      players.length
        ? players.slice(0, 5).map((p, i) => `${medals[i]}  ${p.username}  —  Lv ${p.level}`).join("\n")
        : "No scores yet – be first! 🎯"
    );

    this.time.delayedCall(5200, () => {
      this.tweens.add({
        targets: [this.lbPanelGfx, this.lbTitle, this.lbText],
        alpha: 0, duration: 400,
      });
    });
  }

  /* ═══════════════════════════════════════════
     KNIFE MARKERS
  ═══════════════════════════════════════════ */
  _rebuildMarkers() {
    for (const m of this.knifeMarkers) m.destroy();
    this.knifeMarkers = [];
    const spacing = Math.min(22, (GAME_WIDTH - 60) / Math.max(1, this.hitsRequired));
    const totalW = spacing * (this.hitsRequired - 1);
    for (let i = 0; i < this.hitsRequired; i++) {
      const mx = GAME_WIDTH / 2 - totalW / 2 + i * spacing;
      const m = this.add.image(mx, 140, "knifeMarkerOff").setScale(0.042).setDepth(10);
      this.knifeMarkers.push(m);
    }
  }

  _updateMarker(index, on) {
    const m = this.knifeMarkers[index];
    if (!m) return;
    m.setTexture(on ? "knifeMarkerOn" : "knifeMarkerOff");
    this.tweens.add({ targets: m, scale: 0.07, duration: 80, yoyo: true });
  }

  /* ═══════════════════════════════════════════
     GLOW RING
  ═══════════════════════════════════════════ */
  _drawGlowRing(alpha) {
    this.glowRing.clear();
    /* outer soft glow layers */
    for (let r = 5; r >= 1; r--) {
      this.glowRing.lineStyle(r * 5, 0xd4ff71, alpha * (0.04 / r));
      this.glowRing.strokeCircle(this.targetCenter.x, this.targetCenter.y, this.targetRadius + 6);
    }
    /* crisp inner ring */
    this.glowRing.lineStyle(1.5, 0xd4ff71, alpha * 0.5);
    this.glowRing.strokeCircle(this.targetCenter.x, this.targetCenter.y, this.targetRadius);
  }

  /* ═══════════════════════════════════════════
     SCREEN FX
  ═══════════════════════════════════════════ */
  _shake(strength, duration) {
    this.cameras.main.shake(duration, strength / 1000);
  }

  _flashScreen(color, alpha, duration) {
    const g = this.add.graphics().setDepth(50);
    g.fillStyle(color, alpha);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.tweens.add({ targets: g, alpha: 0, duration, onComplete: () => g.destroy() });
  }

  /* ═══════════════════════════════════════════
     PARTICLES
  ═══════════════════════════════════════════ */
  _spawnHitParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(70, 180);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 1, size: Phaser.Math.FloatBetween(2, 5), color,
      });
    }
  }

  _spawnBurstParticles(x, y) {
    const colors = [0xd4ff71, 0xff6699, 0x66ccff, 0xffaa33, 0xffffff, 0xff9922];
    for (let i = 0; i < 50; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(90, 300);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 70,
        life: 1, size: Phaser.Math.FloatBetween(3, 9),
        color: Phaser.Utils.Array.GetRandom(colors),
      });
    }
  }

  _tickParticles(dt) {
    this.particleGfx.clear();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;          // gravity
      p.life -= dt * 1.8;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      const a = p.life;
      const s = p.size * a;
      this.particleGfx.fillStyle(p.color, a);
      this.particleGfx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════════════ */

async function loginUser() {
  const username = document.getElementById("username").value.trim();
  const mobile_number = document.getElementById("mobile").value.trim();
  if (!username || !mobile_number) { showLoginError("Please fill in both fields."); return; }

  const btn = document.getElementById("loginBtn");
  btn.disabled = true;
  btn.querySelector(".btn-text").textContent = "Starting…";
  btn.querySelector(".btn-spinner").style.display = "inline-block";

  try {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, mobile_number }),
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      authToken = data.token;
      /* slide-out login */
      document.getElementById("login-container").style.display = "none";
    } else {
      showLoginError(data.message || "Login failed. Try again.");
    }
  } catch {
    showLoginError("Network error. Check your connection.");
  } finally {
    btn.disabled = false;
    btn.querySelector(".btn-text").textContent = "Start Game";
    btn.querySelector(".btn-spinner").style.display = "none";
  }
}

function showLoginError(msg) {
  const el = document.getElementById("login-error");
  if (el) { el.textContent = msg; el.style.display = "block"; }
}

/* ═══════════════════════════════════════════════════════════
   BOOTSTRAP
   ═══════════════════════════════════════════════════════════ */

window.onload = function () {
  const lc = document.getElementById("login-container");
  if (authToken) {
    lc.style.display = "none";
  } else {
    lc.style.display = "flex";
  }

  emojiBusterGame = new Phaser.Game({
    type: Phaser.CANVAS,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#0b0f14",
    pixelArt: false,
    antialias: true,
    roundPixels: false,
    scene: [EmojiBusterScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });
};