# Invoice Management System - GitHub & Deployment Quick Start

## 📋 Quick Checklist

- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Set up Render account and deploy backend
- [ ] Set up Vercel account and deploy frontend
- [ ] Configure environment variables
- [ ] Update CORS settings
- [ ] Test live deployment

---

## 🚀 Step-by-Step Instructions

### Step 1: Initialize Git & Push to GitHub (10 minutes)

```powershell
# Navigate to project root
cd e:\Apache\htdocs\Invoice

# Initialize git
git init

# Configure git (do this once)
git config --global user.email "your-email@example.com"
git config --global user.name "Your Name"

# Add all files
git add .

# Commit
git commit -m "Initial commit: Invoice Management System v1.0"

# Create repository on GitHub.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/invoice-management-system.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy Backend to Render (15 minutes)

**Create PostgreSQL Database:**
1. Go to https://render.com
2. Sign up with GitHub
3. Click **New +** → **PostgreSQL**
4. Set name: `invoice-db`
5. Region: Choose closest
6. Copy the **Internal Database URL**

**Deploy Backend API:**
1. Click **New +** → **Web Service**
2. Select your GitHub repository
3. Configure:
   - **Name**: `invoice-backend`
   - **Runtime**: `Python 3`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT`
4. **Add Environment Variables** (click Advanced):
   ```
   DATABASE_URL = [paste from PostgreSQL]
   SECRET_KEY = generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
   ALGORITHM = HS256
   ACCESS_TOKEN_EXPIRE_MINUTES = 30
   DEBUG = False
   CORS_ORIGINS = ["https://your-frontend.vercel.app"]
   ```
5. Click **Deploy**
6. **Copy the backend URL** (looks like: `https://invoice-backend.onrender.com`)

---

### Step 3: Deploy Frontend to Vercel (10 minutes)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click **New Project**
4. Select your repository
5. Configure:
   - **Framework Preset**: **Vite**
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. **Add Environment Variables**:
   ```
   VITE_API_URL = https://invoice-backend.onrender.com/api
   ```
7. Click **Deploy**
8. **Copy the frontend URL** (looks like: `https://invoice-app.vercel.app`)

---

### Step 4: Update Backend CORS (5 minutes)

1. Go to Render Dashboard
2. Select `invoice-backend`
3. Click **Environment**
4. Update `CORS_ORIGINS`:
   ```
   ["https://invoice-app.vercel.app"]
   ```
5. Click **Save** (service will auto-redeploy)

---

### Step 5: Test Everything (5 minutes)

1. Open https://invoice-app.vercel.app
2. Login with:
   - Email: `demo@example.com`
   - Password: `demo123`
3. Try creating an invoice
4. Check API docs: https://invoice-backend.onrender.com/docs

---

## 📝 Important Commands

### Git Commands
```powershell
# Check git status
git status

# Make changes and commit
git add .
git commit -m "Fix: description of change"

# Push to GitHub
git push origin main

# See commit history
git log --oneline
```

### Git Branches (for teams)
```powershell
# Create feature branch
git checkout -b feature/new-feature

# Work on feature
git add .
git commit -m "Add new feature"

# Push branch to GitHub
git push origin feature/new-feature

# Create Pull Request on GitHub
# Then merge to main after review
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| "fatal: not a git repository" | Run `git init` in project root |
| "Please tell me who you are" | Run `git config --global user.email "your@email.com"` |
| Backend 502 errors | Check DATABASE_URL environment variable |
| CORS errors on frontend | Update CORS_ORIGINS on Render backend |
| Frontend shows "Cannot GET /" | Check VITE_API_URL environment variable |
| Database connection failed | Verify PostgreSQL URL format |

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Use `.env.example`
2. **Generate strong SECRET_KEY** - Use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
3. **Keep database password secure** - Don't share in commits
4. **Enable GitHub branch protection** - Require PR reviews
5. **Monitor logs regularly** - Check for errors and attacks
6. **Update dependencies monthly** - Check for security patches

---

## 📊 Costs

| Service | Plan | Cost |
|---------|------|------|
| Render (Backend) | Free/Starter | Free or ~$7/month |
| Render (Database) | Free/Starter | Free or ~$15/month |
| Vercel (Frontend) | Hobby/Pro | Free or ~$20/month |
| **Total** | | **Free or ~$42/month** |

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Docs**: https://docs.github.com
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **React Docs**: https://react.dev

---

## ✨ You're Done!

Your Invoice Management System is now live on the internet! 🎉

**Share these URLs with your team:**
- 🌐 Frontend: `https://your-frontend.vercel.app`
- 📊 Backend API: `https://your-backend.onrender.com`
- 📖 API Docs: `https://your-backend.onrender.com/docs`
