# ⚡ Quick Reference Card

## Initial Setup (Do Once)

```powershell
# Configure Git
git config --global user.email "your@email.com"
git config --global user.name "Your Name"

# Navigate to project
cd "e:\Apache\htdocs\Invoice"

# Initialize and push
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/invoice-management-system.git
git branch -M main
git push -u origin main
```

---

## After Every Code Change

```powershell
# 1. Check what changed
git status

# 2. Add changes
git add .

# 3. Commit with description
git commit -m "Brief description of change"

# 4. Push (this auto-deploys!)
git push origin main

# 5. Check deployment
# - Render: https://render.com/dashboard
# - Vercel: https://vercel.com/dashboard
```

---

## Essential Links

| What | Link |
|------|------|
| GitHub | https://github.com/YOUR_USERNAME/invoice-management-system |
| Render Backend | https://render.com/dashboard |
| Vercel Frontend | https://vercel.com/dashboard |
| API Docs | https://invoice-backend.onrender.com/docs |
| Frontend App | https://invoice-app.vercel.app |

---

## Environment Variables

**Backend (Render):**
```
DATABASE_URL = postgresql://invoice_user:password@dpg-xxx.postgres.render.com/invoice_db
SECRET_KEY = [generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"]
ALGORITHM = HS256
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DEBUG = False
CORS_ORIGINS = ["https://invoice-app.vercel.app"]
```

**Frontend (Vercel):**
```
VITE_API_URL = https://invoice-backend.onrender.com/api
```

---

## Common Commands

```powershell
# View recent commits
git log --oneline -5

# Undo last commit (if not pushed yet)
git reset --soft HEAD~1

# See all branches
git branch -a

# Create feature branch
git checkout -b feature/new-feature

# Switch branches
git checkout main
git checkout feature/new-feature

# Delete branch
git branch -d feature/new-feature

# Merge branch
git merge feature/new-feature

# Push to remote
git push origin branch-name

# Pull latest code
git pull origin main
```

---

## Deployment Status

**Check Backend:** `https://invoice-backend.onrender.com/health`

**Check Frontend:** `https://invoice-app.vercel.app`

**View Logs:**
- Render: Dashboard → Service → Logs
- Vercel: Dashboard → Project → Deployments

---

## Demo Credentials

```
Email: demo@example.com
Password: demo123
```

---

## Quick Fixes

| Problem | Fix |
|---------|-----|
| "Cannot connect to API" | Check CORS_ORIGINS on Render |
| "Database connection error" | Verify DATABASE_URL in Render env |
| "Page shows 404" | Check VITE_API_URL in Vercel env |
| "Nothing deploying" | Ensure code is pushed to `main` branch |

---

## File Locations

```
Invoice/
├── .env                          (DON'T commit)
├── .env.example                  (DO commit)
├── .gitignore                    (DO commit)
├── backend/
│   ├── .env                      (DON'T commit)
│   ├── .env.example              (DO commit)
│   ├── requirements.txt          (DO commit)
│   └── main.py
├── frontend/
│   ├── .env                      (DON'T commit)
│   ├── .env.example              (DO commit)
│   ├── package.json              (DO commit)
│   └── src/
├── GITHUB_DEPLOYMENT_COMPLETE.md (READ FIRST!)
├── DEPLOYMENT_GUIDE.md
└── docker-compose.yml
```

---

## Remember!

✅ **DO Commit:**
- Source code (.py, .jsx, .json)
- Configuration (.env.example, .gitignore)
- Documentation (README.md)

❌ **DON'T Commit:**
- .env files (contains secrets!)
- node_modules/, __pycache__/
- venv/, .vscode/
- Database files, logs

---

**Happy Deploying! 🚀**
