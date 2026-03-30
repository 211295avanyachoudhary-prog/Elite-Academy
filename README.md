# 🏫 Elite Academy — エリートアカデミー

> Anime-inspired competitive study platform — React + Firebase
> Rise from Class D to Class A through discipline and hard work.

---

## 📁 Folder Structure

```
elite-academy/
├── src/
│   ├── components/
│   │   ├── auth/AuthPage.js          Login & signup
│   │   ├── chat/Messages.js          Real-time 1-to-1 chat
│   │   ├── dashboard/Dashboard.js    Main hub
│   │   ├── dashboard/Leaderboard.js  Classroom + Global rankings
│   │   ├── profile/Profile.js        User profile + achievements
│   │   ├── study/StudyLogger.js      Log hours → earn points
│   │   ├── study/WeeklyPlanner.js    Editable weekly grid
│   │   ├── study/FocusMode.js        Pomodoro + ambient audio
│   │   └── ui/Sidebar.js             Navigation
│   ├── contexts/AuthContext.js       Auth state
│   ├── lib/firebase.js               Firebase init
│   ├── lib/gameLogic.js              Points, classroom, promotion
│   └── styles/globals.css            Dark neon theme
├── firestore.rules
├── storage.rules
├── vercel.json
└── .env.example
```





### users/{uid}
```
uid, email, username, bio, photoURL
points, streak, totalStudyHours
currentClass (A/B/C/D), classroomId, classroomNumber
createdAt, lastLogin
```

### classrooms/{id}
```
classroomNumber: 1
classes: { A: [uid...], B: [uid...], C: [uid...], D: [uid...] }
```

### studyLogs/{id}
```
userId, subject, hours, topics[], pointsEarned, date
```

### chatRooms/{uid1_uid2}
```
participants: [uid1, uid2]
lastMessage, lastMessageTime
  → /messages/{id}: text, senderId, senderName, createdAt
```

### weeklyPlans/{uid}
```
plan: { "Monday_9:00 AM": { subject, note }, ... }
```

---

## ⚡ Points System

| Action            | Points |
|-------------------|--------|
| Daily login       | +5     |
| Streak bonus      | +10    |
| Per hour studied  | +15    |
| Per topic covered | +20    |
| Sat discipline    | +100   |

### Class Thresholds
| Class | Points |
|-------|--------|
| D     | 0      |
| C     | 500    |
| B     | 1,500  |
| A     | 3,500  |

---

## 🏫 Classroom Rules

- New user → Class D of next available classroom
- 40 students per classroom (10 per class A/B/C/D)
- Full classroom → new one created automatically
- Students advance individually based on points
- Sunday = rest day, not counted in streak

---

## 🚀 STEP 3: Deploy to Vercel

**Option A — Website (easiest):**
1. Push code to GitHub
2. vercel.com → New Project → import repo
3. Add all 6 REACT_APP_* env variables
4. Framework: Create React App → Deploy

**Option B — CLI:**
```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 🎨 Themes
🌌 Default | 🌧️ Rain | 🌊 Ocean | 🌙 Night | ✦ Minimal

## 🎧 Ambient Audio (Web Audio API — no files needed)
🌧️ Rain | 🌊 Ocean | 📡 White Noise | 🌫️ Brown Noise | 🌿 Nature | ☕ Café

---
---

*Built for Class A students. The rest are just catching up.* 👑
