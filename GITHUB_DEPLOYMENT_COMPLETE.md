# 🚀 Complete GitHub Push & Deployment Guide (Windows PowerShell)

## 📋 Overview

This guide walks you through:
1. **Push to GitHub** (5 min)
2. **Deploy Backend to Render** (15 min)
3. **Deploy Frontend to Vercel** (10 min)
4. **Set up CI/CD** (5 min)

**Total Time**: ~35 minutes

---

## Phase 1: Setup Git & GitHub (5 minutes)

### 1.1 Install Git (if not already installed)

```powershell
# Check if Git is installed
git --version

# If not installed, download from: https://git-scm.com/download/win
# Run installer and choose "Use Git from PowerShell"
```

### 1.2 Configure Git

```powershell
# Set your git user (one time setup)
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# Verify
git config --global user.name
git config --global user.email
```

### 1.3 Create GitHub Repository

1. Go to https://github.com/new
2. **Repository Name**: `invoice-management-system`
3. **Description**: `A comprehensive billing & inventory management system`
4. **Public** (for free deployment)
5. **DON'T** initialize with README (we have one)
6. Click **Create Repository**
7. Copy the HTTPS URL (looks like: `https://github.com/YOUR_USERNAME/invoice-management-system.git`)

### 1.4 Push Code to GitHub

```powershell
# Navigate to project root
cd "e:\Apache\htdocs\Invoice"

# Initialize local git repository
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: Invoice Management System v1.0

- FastAPI backend with PostgreSQL
- React frontend with Tailwind CSS
- Docker support
- Authentication & JWT
- Billing and inventory management"

# Add remote (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/invoice-management-system.git

# Rename branch to main (GitHub standard)
git branch -M main

# Push to GitHub
git push -u origin main

# Verify
git log --oneline
```

✅ **Code is now on GitHub!**

---

## Phase 2: Deploy Backend to Render (15 minutes)

### 2.1 Create Render Account

1. Go to https://render.com
2. Click **Sign up**
3. Choose **Sign up with GitHub**
4. Authorize Render to access your GitHub

### 2.2 Deploy PostgreSQL Database

1. From Render dashboard, click **New +** → **PostgreSQL**
2. Fill in details:
   - **Name**: `invoice-db`
   - **Database**: `invoice_db`
   - **User**: `invoice_user`
   - **Password**: `invoice_password` (change in production)
   - **Region**: Select closest to your location
   - **Plan**: **Free** (no SSL required for internal)
3. Click **Create Database**
4. Wait 2-3 minutes for creation
5. **IMPORTANT**: Copy the **Internal Database URL**
   - Example: `postgresql://invoice_user:invoice_password@dpg-xxx.postgres.render.com/invoice_db`

### 2.3 Deploy Backend API

1. Click **New +** → **Web Service**
2. Select **Connect a repository** → your `invoice-management-system` repo
3. Fill in:
   - **Name**: `invoice-backend`
   - **Environment**: `Python 3`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: 
     ```
     gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT
     ```
   - **Plan**: **Free** (or Starter for production)

4. Click **Advanced** and add **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Paste the PostgreSQL URL from 2.2 |
   | `SECRET_KEY` | Generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
   | `ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` |
   | `DEBUG` | `False` |
   | `CORS_ORIGINS` | `["http://localhost:3000", "http://localhost:5173"]` (update after frontend deploy) |

5. Click **Create Web Service**
6. Wait for deployment (5-10 minutes)
7. **IMPORTANT**: Copy the backend URL from the top
   - Example: `https://invoice-backend.onrender.com`
8. Check if running:
   ```powershell
   # PowerShell: Test backend
   Invoke-WebRequest "https://invoice-backend.onrender.com/docs"
   ```

✅ **Backend is deployed!**

---

## Phase 3: Deploy Frontend to Vercel (10 minutes)

### 3.1 Create Vercel Account

1. Go to https://vercel.com
2. Click **Sign up**
3. Choose **Continue with GitHub**
4. Authorize Vercel

### 3.2 Deploy Frontend

1. Click **Add New...** → **Project**
2. **Import Git Repository**
3. Select your `invoice-management-system` repo
4. Configure:
   - **Project Name**: `invoice-app`
   - **Framework**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Click **Environment Variables** and add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://invoice-backend.onrender.com/api` |

6. Click **Deploy**
7. Wait for deployment (2-3 minutes)
8. **IMPORTANT**: Copy the frontend URL from the top
   - Example: `https://invoice-app.vercel.app`

✅ **Frontend is deployed!**

---

## Phase 4: Update CORS & Test (5 minutes)

### 4.1 Update Backend CORS Settings

1. Go to https://render.com/dashboard
2. Click on `invoice-backend` service
3. Go to **Environment**
4. Find `CORS_ORIGINS` variable
5. Update to: `["https://invoice-app.vercel.app", "http://localhost:3000"]`
6. Click **Save**
7. Service will auto-redeploy (1-2 minutes)

### 4.2 Test the Application

```powershell
# Open frontend in browser
Start-Process "https://invoice-app.vercel.app"
```

**Test Steps:**
1. ✅ Login page loads
2. ✅ Login with demo credentials:
   - Email: `demo@example.com`
   - Password: `demo123`
3. ✅ Dashboard loads
4. ✅ Can create a product
5. ✅ Can create an invoice
6. ✅ Can view reports

### 4.3 Check Backend API

```powershell
# Test API endpoint
$response = Invoke-WebRequest "https://invoice-backend.onrender.com/docs"
$response.StatusCode
```

---

## Phase 5: Setup GitHub Actions CI/CD (Optional but Recommended)

### 5.1 Create GitHub Secrets

1. Go to your GitHub repo
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

   | Name | Value | Where to Get |
   |------|-------|-------------|
   | `RENDER_DEPLOY_HOOK` | Render backend deploy hook | Render → Service → Settings → Deploy Hook |
   | `VERCEL_TOKEN` | Your Vercel token | Vercel → Settings → Tokens |
   | `VERCEL_ORG_ID` | Your Vercel org ID | Vercel → Settings → Account (scroll down) |
   | `VERCEL_PROJECT_ID` | Your Vercel project ID | Vercel → Project → Settings → Project ID |

### 5.2 How Secrets Work

Whenever you push to `main` branch:
1. GitHub automatically runs tests
2. If all pass, deploys to Render
3. And deploys to Vercel
4. **No manual deployment needed!**

---

## 🎯 Common Tasks After Deployment

### Make Code Changes & Deploy

```powershell
# Navigate to project
cd "e:\Apache\htdocs\Invoice"

# Make your code changes
# For example, edit: backend/routes/products.py

# Stage changes
git add .

# Commit
git commit -m "Feature: Add product categories"

# Push (this triggers auto-deploy!)
git push origin main

# Check deployment status
# - Render: https://render.com/dashboard
# - Vercel: https://vercel.com/dashboard
```

### Create a Feature Branch (Team Work)

```powershell
# Create new branch
git checkout -b feature/add-discounts

# Make changes
# ...edit files...

# Commit
git add .
git commit -m "Add discount feature"

# Push branch
git push origin feature/add-discounts

# Create Pull Request on GitHub
# Wait for review
# Merge when approved
```

### View Logs & Debug

```powershell
# View git history
git log --oneline -10

# View specific commit
git show abc1234

# Check git status
git status

# View recent changes
git diff
```

---

## 🆘 Troubleshooting Guide

### Git Issues

```powershell
# "fatal: not a git repository"
git init

# "Please tell me who you are"
git config --global user.email "your@email.com"
git config --global user.name "Your Name"

# "Permission denied (publickey)"
# Generate SSH key: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

# "The current branch main has no upstream branch"
git push -u origin main

# Undo last commit (before push)
git reset --soft HEAD~1
git reset --hard HEAD~1  # WARNING: deletes changes
```

### Backend Deployment Issues

| Error | Solution |
|-------|----------|
| **502 Bad Gateway** | Check DATABASE_URL in Render environment |
| **CORS Error on frontend** | Update CORS_ORIGINS in Render |
| **Database connection refused** | Wait 2 min for DB to fully start |
| **Import errors** | Ensure requirements.txt has all packages |

### Frontend Issues

| Error | Solution |
|-------|----------|
| **Cannot GET /** | Check VITE_API_URL in Vercel env |
| **API 404 errors** | Verify backend is running and URL is correct |
| **Page blank** | Check browser console (F12) for errors |
| **Slow load** | Check network tab, might be waiting for API |

### Reset Everything

```powershell
# Start fresh if something went wrong
cd "e:\Apache\htdocs\Invoice"

# Remove git history
Remove-Item -Recurse -Force .git

# Reinitialize
git init
git add .
git commit -m "Reinit"
git remote add origin https://github.com/YOUR_USERNAME/repo.git
git branch -M main
git push -u origin main
```

---

## 🔒 Security Checklist

- [ ] Changed `SECRET_KEY` to random value
- [ ] Database password is strong
- [ ] `DEBUG = False` in production
- [ ] CORS_ORIGINS only includes your domains
- [ ] GitHub secrets are not logged anywhere
- [ ] Never committed `.env` file
- [ ] Enabled GitHub branch protection
- [ ] All API keys are in environment variables

---

## 📊 Cost Overview

| Service | Free Plan | Paid Plan | Your Setup |
|---------|-----------|-----------|-----------|
| **Render (Backend)** | 0.50 CPU, 512MB RAM | $7/month | Free ✅ |
| **Render (Database)** | 256MB | $15/month | Free ✅ |
| **Vercel (Frontend)** | Unlimited | $20/month | Free ✅ |
| **GitHub** | Public repos | $4-21/month | Free ✅ |
| **Total** | | ~$42/month | **Free!** |

---

## 📞 Resources & Support

- **Git**: https://git-scm.com/doc
- **GitHub**: https://docs.github.com
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **React**: https://react.dev

---

## ✅ Final Checklist

- [ ] Code pushed to GitHub
- [ ] Backend running on Render
- [ ] Database created and connected
- [ ] Frontend deployed to Vercel
- [ ] CORS updated on backend
- [ ] Tested login on live site
- [ ] API docs accessible
- [ ] GitHub secrets configured
- [ ] Shared URLs with team

---

## 🎉 Success!

Your Invoice Management System is now live on the internet!

**Live URLs:**
- 🌐 **Frontend**: `https://invoice-app.vercel.app`
- 📊 **Backend API**: `https://invoice-backend.onrender.com`
- 📖 **API Docs**: `https://invoice-backend.onrender.com/docs`

**Share these with your team to start using the app!**

---

**Questions?** Check the troubleshooting section above or review the documentation files in the project:
- `DEPLOYMENT_GUIDE.md` - Detailed deployment steps
- `PUSH_AND_DEPLOY.md` - Quick reference guide
- `README.md` - Project overview
- `QUICKSTART.md` - Getting started guide
