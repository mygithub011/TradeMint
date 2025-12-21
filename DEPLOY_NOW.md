# 🚀 QUICK DEPLOYMENT STEPS

## Your backend is ready to deploy! Choose one option below:

---

## ⭐ OPTION 1: RENDER (RECOMMENDED - Easiest & Free)

### 1. Create GitHub Repository
Go to https://github.com/new and create a new repository named `smart-trade-backend`

### 2. Push Your Code
```powershell
git remote add origin https://github.com/YOUR_USERNAME/smart-trade-backend.git
git branch -M main
git push -u origin main
```

### 3. Deploy on Render
1. Go to: https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select `smart-trade-backend` repository
4. Configure:
   - **Name**: smart-trade-api
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Add Environment Variables**:
   ```
   SECRET_KEY = (click "Generate" button)
   DATABASE_URL = sqlite:///./smarttrade.db
   ```
6. Click **"Create Web Service"**
7. Wait 5-10 minutes for deployment
8. Get your URL: `https://smart-trade-api.onrender.com`

**✅ DONE! Your API is live!**

---

## 🚂 OPTION 2: RAILWAY (Also Free & Fast)

### 1. Create GitHub Repository (same as above)
```powershell
git remote add origin https://github.com/YOUR_USERNAME/smart-trade-backend.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Railway
1. Go to: https://railway.app/
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `smart-trade-backend`
5. Railway auto-detects Python and deploys!
6. **Set Environment Variables** in Settings:
   ```
   SECRET_KEY = (generate random string)
   DATABASE_URL = sqlite:///./smarttrade.db
   ```
7. Get your URL from Settings

**✅ DONE!**

---

## 🔧 OPTION 3: Manual Server (VPS/EC2)

If you have a VPS or cloud server:

```bash
# SSH into your server
ssh user@your-server.com

# Clone repository
git clone https://github.com/YOUR_USERNAME/smart-trade-backend.git
cd smart-trade-backend

# Install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
nano .env
# Add your environment variables

# Run with Gunicorn
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 📱 After Deployment

### Update Your Frontend
Replace the API URL in your frontend:
```javascript
// Change from
const API_URL = 'http://localhost:8000'

// To
const API_URL = 'https://smart-trade-api.onrender.com'
```

### Test Your Deployed API
```bash
# Health check
curl https://smart-trade-api.onrender.com/health

# Register user
curl -X POST https://smart-trade-api.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123","role":"client"}'

# View API docs
# Visit: https://smart-trade-api.onrender.com/docs
```

---

## 🎯 Quick Start (Copy-Paste)

```powershell
# 1. Create repo on GitHub: https://github.com/new (name it: smart-trade-backend)

# 2. Run these commands (replace YOUR_USERNAME):
git remote add origin https://github.com/YOUR_USERNAME/smart-trade-backend.git
git branch -M main
git push -u origin main

# 3. Deploy on Render: https://dashboard.render.com/
#    - Connect GitHub repo
#    - Use settings above
#    - Click Deploy!

# 4. Update frontend API URL to your new Render URL

# ✅ DONE!
```

---

## ⚠️ Important Notes

1. **Free Tier Limitations**:
   - Render: Service sleeps after 15 min inactivity (wakes up on request)
   - Database: SQLite data resets on redeploy (upgrade to PostgreSQL for persistence)

2. **Generate Secure SECRET_KEY**:
   ```python
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

3. **Database Persistence**:
   - For production, use PostgreSQL (Render offers free PostgreSQL database)
   - Or use external database service like Supabase, PlanetScale

---

## 📞 Need Help?

- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app/
- Full deployment guide: See `DEPLOYMENT.md` in this folder
