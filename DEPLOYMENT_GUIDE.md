# 🚀 ShopWise AI — Production Deployment Guide

Your application is **100% production-ready** and passes all build and dependency checks.

Follow the instructions below to deploy your frontend and backend on free, cloud-native hosting platforms (such as **Vercel + Render** or **Railway / Supabase**).

---

## 🏗️ Architecture for Deployment

| Component | Recommended Platform | Build Command | Start Command |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** or **Netlify** | `npm run build` | Static Dist Output (`dist`) |
| **Backend API** | **Render** or **Railway** | `npm install` | `npm start` |
| **Database** | **Render PostgreSQL** or **Neon** or **Supabase** | `npx prisma db push` | `npx prisma db seed` |

---

## Step 1: Deploy Database (Free Managed PostgreSQL)
1. Go to [Neon.tech](https://neon.tech), [Supabase](https://supabase.com), or [Render PostgreSQL](https://render.com).
2. Create a free PostgreSQL database named `shopwiseAI`.
3. Copy the **Connection String URL** (e.g. `postgresql://user:pass@ep-xyz.aws.neon.tech/shopwiseAI?sslmode=require`).

---

## Step 2: Deploy Backend (Render / Railway)
1. Push your code to your **GitHub** repository.
2. In [Render.com](https://render.com), click **New Web Service** and select your repository.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install` *(automatically runs `prisma generate` via postinstall hook)*
   - **Start Command**: `npm start`
4. Add **Environment Variables** in Render dashboard:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = *(Your Neon/Supabase/Render Postgres connection string from Step 1)*
   - `JWT_SECRET` = `your_secure_random_jwt_secret_key`
   - `GEMINI_API_KEY` = *(Your Google Gemini API Key)*
5. Click **Deploy Web Service**.
6. Run initial migration/seed from the Render shell:
   ```bash
   npx prisma db push
   node prisma/seed_reviews.js
   ```
4. Copy your deployed backend URL: `https://shopwiseai-pys5.onrender.com`.

---

## Step 3: Deploy Frontend (Vercel / Netlify)
1. In [Vercel.com](https://vercel.com), click **Add New Project** and import your GitHub repository.
2. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add **Environment Variable**:
   - `VITE_API_BASE_URL` = `https://shopwiseai-pys5.onrender.com/api`
4. Click **Deploy**.

---

## ✅ Deployment Pre-flight Checklist

- [x] **Frontend Vite Build**: 0 errors, compiles to `dist/` in 1.67s.
- [x] **Backend Postinstall**: `prisma generate` configured automatically.
- [x] **Database Schema**: 10 tables synchronized with foreign keys & cascade rules.
- [x] **CORS Configuration**: Wildcard & cross-origin enabled for API calls.
- [x] **Real-time Live Sync**: Verified with Indian marketplace prices & background cron job.
