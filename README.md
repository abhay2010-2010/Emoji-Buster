# 🎯 Emoji Buster

A fun and addictive knife-hit style arcade game built using **Phaser.js** with leaderboard support, login authentication, score tracking, sound effects, and animated gameplay.

---

# 🚀 Live Demo

## 🌐 Frontend
https://emoji-burster.vercel.app/

## 🌐 Backend
https://emoji-buster.onrender.com/

## 🌐 API Testing
http://localhost:5000/api-docs/

---

# 📌 Features

- 🔥 Smooth knife throwing gameplay
- 🎯 Rotating target mechanics
- 🏆 Live leaderboard system
- 🔐 Login authentication using JWT
- 📈 Score & level tracking
- 🔊 Sound effects integration
- 🎨 PNG assets & animated UI
- 📱 Responsive gameplay
- ⚡ Fast deployment using Vercel

---

# 🛠️ Tech Stack

## Frontend
- HTML5
- CSS3
- JavaScript
- Phaser.js

## Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication

## Deployment
- Vercel (Frontend)
- Render / Railway / VPS (Backend)

---

# 📂 Project Structure

```bash
# 📂 Project Folder Structure

emoji-buster/
│
├── frontend/
│   │
│   ├── assets/
│   │   ├── 2nd.png
│   │   ├── albuLogo.png
│   │   ├── background.png
│   │   ├── favi.png
│   │   ├── heart.png
│   │   ├── heartEmpty.png
│   │   ├── knife.png
│   │   ├── knifeMarketOff.png
│   │   ├── knifeMarketOn.png
│   │   ├── loading.png
│   │   ├── logo.png
│   │   ├── playButton.png
│   │   ├── replayButton.png
│   │   ├── socialDistancing.png
│   │   ├── solitaire.png
│   │   └── targets.png
│   │
│   ├── sounds/
│   │   ├── swoosh.mp3
│   │   ├── knifeHit.mp3
│   │   ├── knifeMiss.mp3
│   │   ├── knifeWin.mp3
│   │   └── covidBurst.mp3
│   │
│   ├── fonts/
│   │   └── fontLoader.css
│   │
│   ├── game.js
│   ├── phaser.js
│   ├── index.html
│   ├── style.css
│   ├── package.json
│   ├── vercel.json
│   └── README.md
│
│
backend/
│
├── src/
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── scoreController.js
│   │   └── leaderboardController.js
│   │
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   └── Score.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── scoreRoutes.js
│   │   └── leaderboardRoutes.js
│   │
│   └── app.js
│
├── .env
├── server.js
├── swagger.js
├── package.json
├── package-lock.json
└── README.md
│
│
├── .gitignore
├── README.md
└── LICENSE
```

---

# 🎮 Gameplay Rules

- Tap anywhere to throw the knife.
- Avoid hitting existing knives.
- Clear all required hits to level up.
- If collision happens, you lose life.
- Higher levels increase rotation speed.
- Compete on the leaderboard.

---

# 🔐 Authentication API

## Login API

### Endpoint

```http
POST /api/login
```

### Request Body

```json
{
  "username": "abhay001",
  "mobile_number": "9876543210"
}
```

### Response

```json
{
  "success": true,
  "token": "JWT_TOKEN"
}
```

---

# 🏆 Submit Score API

## Endpoint

```http
POST /api/score
```

## Headers

```http
Authorization: Bearer JWT_TOKEN
```

## Request Body

```json
{
  "game_id": 1,
  "level": 5
}
```

---

# 📊 Leaderboard API

## Endpoint

```http
GET /api/leaderboard?game_id=1
```

## Headers

```http
Authorization: Bearer JWT_TOKEN
```

## Response

```json
{
  "success": true,
  "top_players": [
    {
      "username": "abhay001",
      "highest_level": 10
    }
  ]
}
```

---

# ⚙️ Local Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/emoji-buster.git
```

---

## 2️⃣ Open Project

```bash
cd emoji-buster
```

---

## 3️⃣ Start Frontend

You can directly run with VS Code Live Server.

OR

```bash
npx serve .
```

---

## 4️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env`

```env
PORT=5000
MONGO_URI=YOUR_MONGO_URL
JWT_SECRET=YOUR_SECRET
```

Start server:

```bash
npm start
```

---

# 🌍 Deployment

## Frontend Deployment (Vercel)

### Install Vercel

```bash
npm install -g vercel
```

### Deploy

```bash
vercel
```

---

## Backend Deployment

Recommended:
- Render
- Railway
- VPS
- EC2

---

# 🔊 Sound Effects Used

| Sound | Purpose |
|---|---|
| swoosh.mp3 | Knife throw |
| knifeHit.mp3 | Successful hit |
| knifeMiss.mp3 | Miss collision |
| knifeWin.mp3 | Level cleared |
| covidBurst.mp3 | Burst animation |

---

# 🖼️ PNG Assets Used

| Asset | Usage |
|---|---|
| background.png | Game background |
| knife.png | Throwing knife |
| logo.png | Game logo |
| targets.png | Main target |
| replayButton.png | Restart button |
| playButton.png | Start button |
| heart.png | Life icon |
| heartEmpty.png | Empty life |
| favi.png | Website favicon |

---

# 📱 Responsive Design

The game automatically scales based on screen size using:

```javascript
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
}
```

---

# 🔥 Future Improvements

- Multiplayer support
- Firebase authentication
- Power-ups
- Coins system
- Shop system
- Daily rewards
- Mobile APK build
- Particle effects
- Combo system

---

# 👨‍💻 Done By

## Abhay Kawle

- MERN Stack Developer
- Backend/Front-End Engineer
- Phaser.js Game Developer

---


# ⭐ Support

If you like this project:

- ⭐ Star the repository
- 🍴 Fork the project
- 🧠 Share feedback
- 🚀 Contribute improvements

---

# 🙌 Thank You

Thanks for checking out Emoji Buster 🎯🔥
