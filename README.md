<div align="center">

<img src="./frontend/public/logo.png" width="120" alt="Klivra Logo" />

# KLIVRA
### **Modern Project Management & Team Collaboration Hub**
*High-performance, real-time visibility for modern engineering teams.*

---

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[**🚀 Launch App**](https://klivra.vercel.app/) • [**Architecture**](#-architecture) • [**Setup**](#-setup)

</div>

---

## ✨ Features

- 📊 **Interactive Dashboard** — Real-time project health and activity narratives.
- 📋 **Live Kanban** — High-performance task tracking with zero latency.
- 💬 **Instant Messaging** — Team chat with file sharing and smart notifications.
- 🎨 **Shared Whiteboard** — Collaborative canvas for architectural planning.
- 🔒 **Security First** — Enterprise-grade isolation and audit logging.

---

## 📐 Architecture

Klivra is engineered for extreme performance and data integrity. It utilizes a **Centralized Real-time Logic** layer via `useSocketStore.js`, ensuring instant synchronization across all client instances without redundant network overhead.

- **Frontend**: React 19, Zustand, Framer Motion.
- **Backend**: Node.js 22, Express 5, MongoDB.
- **Real-time**: Dedicated Socket.io pipeline with Redis adapter.

---

## 🚀 Quick Start

### 1. Initialize
```bash
git clone https://github.com/JuhaWorks/Klivra.git
cd Klivra
```

### 2. Environment Configuration
Create a `.env` file in the `backend/` and `frontend/` directories using the following keys as a guide:

**Backend (`backend/.env`)**
- `MONGO_URI`, `JWT_SECRET`, `SESSION_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `BREVO_API_KEY`, `EMAIL_USER`, `EMAIL_PASS`
- `NASA_API_KEY`, `OPENWEATHER_API_KEY`, `FAVQS_API_KEY`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_MAIL_TO`

**Frontend (`frontend/.env.development`)**
- `VITE_API_URL`, `VITE_NASA_API_KEY`, `VITE_FAVQS_API_KEY`

### 3. Run Locally
```bash
# Terminal 1: Backend
cd backend && npm install && npm run dev

# Terminal 2: Frontend
cd frontend && npm install && npm run dev
```

---

<div align="center">

**Professional. Performant. Precise.**

[License](LICENSE) • [Support](https://github.com/JuhaWorks/Klivra) • [Documentation](https://github.com/JuhaWorks/Klivra)

</div>

