# STREETDRIP.AI // GEN Z STREETWEAR PLATFORM, BLOG & SECURE ADMIN VAULT

> Complete, production-ready men's fashion platform with 3D product inspection, AI 4-piece vibe styling, an editorial **Street Journal / Blog system**, and a **security-hardened JWT Admin Panel**.

---

## ⚡ Key Features

1. **Minimalist Streetwear Interface**:
   - Clean, high-impact dark aesthetic inspired by modern editorial streetwear (SSENSE, Grailed, Highsnobiety).
   - Intuitive navigation: Catalog Feed, 3D WebGL Vault, AI Vibe Stylist, Street Journal (Blog), and Admin Portal.
2. **Interactive 3D WebGL Showcase (Three.js)**:
   - 360° click-and-drag rotation, wheel zoom, turntable spin, and wireframe mode.
   - Streetwear staples: Chunky Sneaker, Tactical G-Shock Watch, and Y2K Matrix Shield Shades.
3. **AI 4-Piece Vibe Generator (`/recommend/vibe`)**:
   - Synthesizes matching Top + Bottom + Shoes + Accessory bundles from aesthetic prompts (*"Late night drive"*, *"College fest"*, etc.).
4. **Street Journal (Blog Editorial System)**:
   - Categorized articles: *Style Guides*, *Drop Alerts*, *Sneaker Culture*, *Techwear & Aesthetics*.
   - Minimalist full-essay reading modal with reading time, author, and share tools.
5. **Secure Admin Dashboard (`/admin`)**:
   - JWT authentication for secure admin access without attempt lockout limits.
   - Ingest new clothing items & write new blog essays with live card previews.
   - Quick inline editing of retail prices, drop tags, and affiliate links.
   - Permanent deletion protection with confirmation dialogues.

---

## 🔐 Default Admin Credentials

| Credential | Value |
|---|---|
| **Admin Route** | `http://localhost:3000/admin` |
| **Username** | `admin@streetdrip.ai` (configurable via `ADMIN_USERNAME`) |
| **Password** | `dripadmin123` (configurable via `ADMIN_PASSWORD`) |

---

## 🛡️ Security & Anti-Hacking Protections (Preventing Leaks)

1. **Brute-Force Rate Limiting**:
   - Automatically tracks failed login attempts by client IP.
   - After **5 consecutive failed attempts**, the IP address is locked out for 10 minutes.
2. **Strict Security Headers**:
   - `X-Frame-Options: DENY` (Blocks clickjacking/embedding).
   - `X-Content-Type-Options: nosniff` (Prevents MIME-type sniffing exploits).
   - `X-XSS-Protection: 1; mode=block` (Mitigates reflected XSS).
   - `Strict-Transport-Security` (Enforces HTTPS encrypted transport).
   - `Referrer-Policy: strict-origin-when-cross-origin` (Protects affiliate redirect privacy).
3. **XSS Input Sanitization**:
   - Strips malicious `<script>` tags, `javascript:` pseudoprotocols, and inline event handlers from submitted blog essays and product descriptions.
4. **Environment-Based Secret Management**:
   - Set `JWT_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` in your production environment variables so no credentials exist in source code.

---

## 🌐 100% Free Live Hosting Guide

You can host both your Frontend and Backend online completely free with free SSL certificates (`https://`).

### Part 1: Deploy Backend to Render.com (Free)
1. Push your repository to **GitHub**.
2. Go to **[render.com](https://render.com)** and create a free account.
3. Click **New + > Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt` (or leave empty if using `server.py`)
   - **Start Command**: `python server.py` (or `python main.py`)
   - **Instance Type**: `Free`
6. Under **Environment Variables**, add:
   - `JWT_SECRET`: *(A random 32-character string, e.g. `9f8b7a6c5d4e3f2a1b0c9d8e7f6a5b4c`)*
   - `ADMIN_USERNAME`: *(Your secret admin email)*
   - `ADMIN_PASSWORD`: *(A strong password with 12+ characters)*
7. Click **Create Web Service**.
8. Render will provide a live URL, e.g. `https://streetdrip-api.onrender.com`.

---

### Part 2: Deploy Frontend to Vercel (Free)
1. Go to **[vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **Add New > Project** and select your repository.
3. In the project setup:
   - **Root Directory**: Select `frontend`
   - **Framework Preset**: `Next.js`
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g. `https://streetdrip-api.onrender.com`)
5. Click **Deploy**.
6. Within 60 seconds, Vercel will give you a live HTTPS domain (e.g. `https://streetdrip.vercel.app`)!

---

## 💻 Local Development

### Option A: Zero-Dependency Python Server (Instant on Python 3.14+)
```bash
# Terminal 1: Backend
cd backend
python3 server.py

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

### Option B: FastAPI with Virtual Environment
```bash
# Terminal 1: Backend
cd backend
/usr/bin/python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py

# Terminal 2: Frontend
cd frontend
npm run dev
```
