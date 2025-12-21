# Smart Trade Backend - Deployment Guide

## 🚀 Quick Deploy to Render (Recommended - Free Tier Available)

### Prerequisites
- GitHub account
- Render account (sign up at https://render.com)

### Step 1: Push Code to GitHub

```bash
cd C:\Users\anuragmishra\Downloads\Smart_Trade_Working_MVP\backend

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Backend ready for deployment"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/smart-trade-backend.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy on Render

1. **Go to Render Dashboard**: https://dashboard.render.com/

2. **Click "New +" → "Web Service"**

3. **Connect Your GitHub Repository**
   - Select the repository you just pushed

4. **Configure the Service**:
   - **Name**: `smart-trade-api`
   - **Region**: Choose nearest to you
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or `.` if required)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. **Set Environment Variables** (Click "Advanced" → "Add Environment Variable"):
   ```
   SECRET_KEY = <generate a secure random string>
   DATABASE_URL = sqlite:///./smarttrade.db
   ALGORITHM = HS256
   ACCESS_TOKEN_EXPIRE_MINUTES = 1440
   TELEGRAM_BOT_TOKEN = <your telegram bot token or leave empty>
   ```

6. **Click "Create Web Service"**

7. **Wait for Deployment** (5-10 minutes)
   - Render will build and deploy your app
   - You'll get a URL like: `https://smart-trade-api.onrender.com`

### Step 3: Update Frontend

Update your frontend to use the deployed backend URL:
```javascript
const API_BASE_URL = 'https://smart-trade-api.onrender.com';
```

---

## Alternative Deployment Options

### Option 2: Deploy to Railway

1. **Go to Railway**: https://railway.app/
2. **Click "New Project" → "Deploy from GitHub repo"**
3. **Select your repository**
4. **Railway will auto-detect Python and deploy**
5. **Set environment variables in Settings**
6. **Get your deployed URL**

### Option 3: Deploy to Vercel (Serverless)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Create `vercel.json`:
   ```json
   {
     "builds": [
       {
         "src": "app/main.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "app/main.py"
       }
     ]
   }
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

### Option 4: Deploy to Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create smart-trade-api`
4. Set buildpack: `heroku buildpacks:set heroku/python`
5. Set environment variables:
   ```bash
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set DATABASE_URL=sqlite:///./smarttrade.db
   ```
6. Deploy: `git push heroku main`

---

## 📝 Important Notes

### Database Persistence
- **SQLite on Render**: Files are ephemeral on free tier (resets on redeploy)
- **For Production**: Upgrade to PostgreSQL or use Render's database service

### Upgrade to PostgreSQL (Production Ready)

1. **Create Render PostgreSQL Database**:
   - In Render dashboard: New + → PostgreSQL
   - Copy the "Internal Database URL"

2. **Update requirements.txt**:
   ```
   psycopg2-binary==2.9.9
   ```

3. **Update DATABASE_URL** environment variable to PostgreSQL URL

4. **Update database.py** (already compatible with PostgreSQL!)

### File Uploads
- For production, use cloud storage:
  - AWS S3
  - Cloudinary
  - Google Cloud Storage

### Environment Variables to Set

```env
# Required
SECRET_KEY=<generate-with-openssl-rand-hex-32>
DATABASE_URL=sqlite:///./smarttrade.db

# Optional
TELEGRAM_BOT_TOKEN=<your-bot-token>
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ALGORITHM=HS256
```

### Generate Secure SECRET_KEY

Run this in Python:
```python
import secrets
print(secrets.token_hex(32))
```

Or in terminal:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🔍 Testing Deployment

Once deployed, test your API:

```bash
# Health check
curl https://your-app-url.onrender.com/health

# Register user
curl -X POST https://your-app-url.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test@123", "role": "client"}'

# API Documentation
# Visit: https://your-app-url.onrender.com/docs
```

---

## 🐛 Troubleshooting

### Build Fails
- Check `requirements.txt` has all dependencies
- Verify Python version in `runtime.txt`

### App Crashes
- Check logs in Render dashboard
- Verify environment variables are set
- Check database connection

### CORS Errors
- Verify frontend URL is in CORS allowed origins
- Check if using `*` for development

### Database Issues
- SQLite resets on free tier redeploys
- Consider PostgreSQL for persistence
- Check file permissions for SQLite

---

## 🎉 You're Done!

Your backend is now deployed and accessible at:
- API: `https://your-app-url.onrender.com`
- Docs: `https://your-app-url.onrender.com/docs`
- Health: `https://your-app-url.onrender.com/health`

Update your frontend to use the new API URL and you're ready to go!
