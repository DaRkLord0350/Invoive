# 🚀 Complete GitHub & Deployment Guide

## Step 1: Initialize Git & Push to GitHub

### 1.1 Create a GitHub Repository
1. Go to [github.com](https://github.com)
2. Click **New Repository**
3. Name it: `invoice-management-system`
4. Add description: "A comprehensive billing & inventory management system"
5. Choose **Public** (for free deployment)
6. Click **Create Repository** (don't add README, we have one)

### 1.2 Push Code to GitHub

```bash
# Navigate to project root
cd e:\Apache\htdocs\Invoice

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit initial code
git commit -m "Initial commit: Invoice Management System"

# Add remote repository (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/invoice-management-system.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Prepare Backend for Production (Render/Railway)

### 2.1 Update Backend Configuration

**File: `backend/config.py`** - Update to support production:
```python
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# CORS settings for production
CORS_ORIGINS = os.getenv("CORS_ORIGINS", '["http://localhost:3000"]')
```

### 2.2 Create `backend/render.yaml` for Auto-Deploy
```yaml
services:
  - type: web
    name: invoice-backend
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: "gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:10000"
    envVars:
      - key: DATABASE_URL
        scope: SERVICE
      - key: SECRET_KEY
        scope: SERVICE
      - key: ALGORITHM
        value: HS256
      - key: CORS_ORIGINS
        scope: SERVICE
```

### 2.3 Update `backend/requirements.txt` - Add Production Dependencies
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
gunicorn==21.2.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
fastapi-cors==0.0.6
reportlab==4.0.7
pillow==10.1.0
requests==2.31.0
aiofiles==23.2.1
```

---

## Step 3: Deploy Backend to Render

### 3.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your GitHub account

### 3.2 Deploy Database (PostgreSQL)
1. Click **New +** → **PostgreSQL**
2. Fill in:
   - **Name**: `invoice-db`
   - **Database**: `invoice_db`
   - **User**: `invoice_user`
   - **Region**: Select closest to you
   - **Plan**: Free (or Starter for production)
3. Click **Create Database**
4. Copy the connection string from `Internal Database URL`

### 3.3 Deploy Backend API
1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Fill in:
   - **Name**: `invoice-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT`
   - **Root Directory**: `backend`
4. Click **Advanced** and add environment variables:
   - `DATABASE_URL`: Paste the PostgreSQL URL from step 3.2
   - `SECRET_KEY`: Generate a secure key (use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
   - `ALGORITHM`: `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `30`
   - `DEBUG`: `False`
   - `CORS_ORIGINS`: Will update after frontend deployment
5. Click **Create Web Service**
6. Wait for deployment (5-10 minutes)
7. Copy the backend URL (e.g., `https://invoice-backend.onrender.com`)

---

## Step 4: Prepare & Deploy Frontend to Vercel

### 4.1 Update Frontend API URL
Update `frontend/.env.example`:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### 4.2 Create `frontend/.vercelignore`
```
node_modules
.git
.gitignore
README.md
```

### 4.3 Create `vercel.json` in Project Root
```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "env": {
    "VITE_API_URL": "@vite_api_url"
  }
}
```

### 4.4 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your GitHub repository
4. Select `frontend` as root directory
5. Add environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api`
6. Click **Deploy**
7. Wait for deployment (2-3 minutes)
8. Copy frontend URL (e.g., `https://invoice-app.vercel.app`)

---

## Step 5: Update CORS on Backend

1. Go to Render dashboard
2. Select `invoice-backend` service
3. Click **Environment**
4. Update `CORS_ORIGINS`:
   ```
   ["https://your-frontend-domain.vercel.app", "http://localhost:3000"]
   ```
5. Click **Save**
6. Service will auto-redeploy

---

## Step 6: Final Testing

### Test Backend API
```bash
# Check API is running
curl https://your-backend-url.onrender.com/health

# Check API docs
https://your-backend-url.onrender.com/docs
```

### Test Frontend
1. Open `https://your-frontend-domain.vercel.app`
2. Try login with demo credentials:
   - Email: `demo@example.com`
   - Password: `demo123`
3. Create a new invoice to test full flow

---

## Step 7: Set Up CI/CD (GitHub Actions)

Create `.github/workflows/deploy.yml` in your repository:
```yaml
name: Deploy to Render & Vercel

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Backend
        env:
          RENDER_DEPLOY_HOOK: ${{ secrets.RENDER_DEPLOY_HOOK }}
        run: curl $RENDER_DEPLOY_HOOK

  deploy-frontend:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Frontend
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          npm install -g vercel
          vercel --prod --token=$VERCEL_TOKEN
```

To set up:
1. Get Render deploy hook from: Render Dashboard → Service Settings → Deploy Hook
2. Get Vercel tokens from: Vercel Dashboard → Account Settings → Tokens
3. Go to GitHub → Settings → Secrets → Add these secrets

---

## 🔐 Security Checklist

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Update database password in production
- [ ] Enable HTTPS only (both platforms do this by default)
- [ ] Set `DEBUG=False` in production
- [ ] Add proper CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable GitHub branch protection rules
- [ ] Add code review requirement before merge to main

---

## 📊 Monitoring & Logs

### View Backend Logs (Render)
1. Dashboard → Service → Logs
2. Filter by service name
3. Search for errors

### View Frontend Logs (Vercel)
1. Dashboard → Project → Deployments
2. Click recent deployment
3. View build and runtime logs

---

## 🆘 Troubleshooting

### Backend not connecting to database
- Check DATABASE_URL format
- Verify PostgreSQL is running
- Check IP whitelist on Render PostgreSQL

### Frontend API 404 errors
- Verify CORS_ORIGINS on backend
- Check VITE_API_URL in frontend
- Ensure backend is deployed

### Deployment stuck
- Push a new commit to trigger redeploy
- Check service logs for errors
- Verify all required environment variables are set

---

## 🎯 Summary

**Total Deployment Time**: ~30 minutes

1. ✅ Push to GitHub (5 min)
2. ✅ Deploy backend on Render (10 min)
3. ✅ Deploy database on Render (5 min)
4. ✅ Deploy frontend on Vercel (5 min)
5. ✅ Update CORS and test (5 min)

Your Invoice Management System is now live! 🎉

---

**Live URLs** (after deployment):
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-backend.onrender.com`
- API Docs: `https://your-backend.onrender.com/docs`
