# REint AI — Production Cloud Deployment Guide

This guide provides step-by-step instructions for deploying **REint AI** to free and production-grade cloud platforms: **Render** (recommended for full-stack in 1 click), **Vercel** (frontend), and **Heroku / Railway** (backend).

---

## Architecture Overview for Cloud Deployment

REint AI consists of two parts:
1. **Backend**: Python FastAPI service (`/backend`) providing REST API endpoints.
2. **Frontend**: React 19 + TypeScript SPA (`/frontend`) consuming the backend API.

The repository includes ready-to-use cloud manifests:
- `render.yaml` — Blueprint deploying both backend and frontend automatically.
- `frontend/vercel.json` — Vercel routing configuration for the React SPA.
- `backend/Procfile` & `backend/runtime.txt` — Heroku & Railway process configuration.

---

## Option 1: 1-Click Deployment on Render (Recommended)

Render natively supports both Python web services and static frontend sites on its free tier.

### Steps:
1. Go to [dashboard.render.com](https://dashboard.render.com/) and sign in with your GitHub account.
2. Click **New +** in the top right and select **Blueprint**.
3. Connect your GitHub repository: `Vishalfarade93/REint-Ai-Assignment`.
4. Render will automatically detect [`render.yaml`](../render.yaml) and configure two services:
   - **`reint-ai-backend`**: Python web service running `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
   - **`reint-ai-frontend`**: Static web application building `frontend/` and serving `dist/`.
5. Click **Apply**.
6. Once deployed:
   - In the `reint-ai-frontend` settings, add the environment variable:
     - `VITE_API_BASE_URL` = `https://<your-backend-service-name>.onrender.com/api`
   - Render will automatically redeploy the frontend with the live backend connection!

---

## Option 2: Deploy Frontend on Vercel + Backend on Render/Heroku

Vercel provides edge hosting for the React frontend, while the backend can run on Render or Heroku.

### Step 2.1: Deploy Backend (Render or Heroku)

#### Via Render Web Service:
1. Go to [dashboard.render.com](https://dashboard.render.com/) -> **New +** -> **Web Service**.
2. Connect `Vishalfarade93/REint-Ai-Assignment`.
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Click **Create Web Service**.
5. Copy your live backend URL (e.g., `https://reint-ai-backend.onrender.com`).

---

### Step 2.2: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com/) and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import `Vishalfarade93/REint-Ai-Assignment`.
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://<your-backend-url>.onrender.com/api`
6. Click **Deploy**.
7. In ~60 seconds, your site is live with a global CDN URL (e.g. `https://reint-ai-assignment.vercel.app`)!

---

## Option 3: Local or Cloud VM via Docker Compose

To deploy on any Linux VPS (AWS EC2, DigitalOcean, Hetzner, etc.):

```bash
# Clone the repository
git clone https://github.com/Vishalfarade93/REint-Ai-Assignment.git
cd REint-Ai-Assignment

# Launch both containers in background
docker compose up -d --build
```

- Frontend is available on port `3000`
- Backend API is available on port `8000`
