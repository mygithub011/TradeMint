# 🚀 Vercel Deployment Guide - Complete Setup

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database**: Choose one:
   - **Vercel Postgres** (recommended): https://vercel.com/docs/storage/vercel-postgres
   - **Neon**: https://neon.tech (generous free tier)
   - **Supabase**: https://supabase.com (includes auth & storage)
3. **GitHub Account**: For code repository

---

## Step 1: Setup PostgreSQL Database

### Option A: Vercel Postgres (Recommended)

1. Go to Vercel Dashboard → Storage → Create Database
2. Select **Postgres**
3. Choose region (closest to your users)
4. Copy the connection string (format: `postgresql://user:pass@host:5432/db`)

### Option B: Neon (Free Tier)

1. Sign up at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string from dashboard
4. Format: `postgresql://user:pass@host/db?sslmode=require`

---

## Step 2: Push Code to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Prepare for Vercel deployment"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/trademint.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy Backend to Vercel

### 3.1 Create New Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project:
   - **Project Name**: `trademint-backend`
   - **Framework Preset**: Other
   - **Root Directory**: `./` (keep as root)

### 3.2 Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secret (generate with: openssl rand -hex 32)
SECRET_KEY=your-secret-key-here-use-openssl-rand-hex-32

# Telegram Bot
TELEGRAM_BOT_TOKEN=8358386533:AAG-zmUuYFUMF0Mq5LX6Vq7TzB-PLW9lpZM

# Razorpay (your actual credentials)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_here

# Cron Job Secret (generate random string)
CRON_SECRET=your-random-cron-secret-here

# Vercel Flag
VERCEL=1
```

### 3.3 Deploy

Click **Deploy** button. Vercel will:
- Build the project
- Deploy to production
- Give you a URL like: `https://trademint-backend.vercel.app`

---

## Step 4: Setup Database Schema

After first deployment, run database migrations:

### 4.1 Install Vercel CLI

```bash
npm i -g vercel
vercel login
```

### 4.2 Run Database Seed Script

Create a temporary script `init_db.py`:

```python
import sys
sys.path.insert(0, '.')
from app.db.database import Base, engine
from app.seed import seed_database

# Create tables
Base.metadata.create_all(bind=engine)
print("✅ Database tables created")

# Seed with test data
seed_database()
```

Run locally with production database URL:

```bash
# Set environment variable temporarily
set DATABASE_URL=your-vercel-postgres-url

# Run script
python init_db.py
```

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Update Frontend Environment

Edit `frontend/.env.production`:

```env
VITE_API_URL=https://trademint-backend.vercel.app
```

### 5.2 Create Frontend Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import same GitHub repository
3. Configure:
   - **Project Name**: `trademint-frontend`
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 5.3 Deploy Frontend

Click **Deploy**. You'll get: `https://trademint-frontend.vercel.app`

---

## Step 6: Configure Vercel Cron Jobs

Vercel Cron is already configured in `vercel.json`:

```json
"crons": [
  {
    "path": "/cron/check-expiry",
    "schedule": "0 * * * *"
  }
]
```

This runs hourly to check expired subscriptions.

**Setup Cron Authorization:**

1. In backend project settings, add `CRON_SECRET` environment variable
2. Vercel will automatically call `/cron/check-expiry` with `Authorization: Bearer <CRON_SECRET>`

---

## Step 7: Test Deployment

### 7.1 Test Backend API

```bash
curl https://trademint-backend.vercel.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 7.2 Test Frontend

1. Open `https://trademint-frontend.vercel.app`
2. Try logging in with test credentials:
   - **Admin**: `admin@smarttrade.com` / `admin123`
   - **Trader**: `trader@example.com` / `trader123`

### 7.3 Test Cron Endpoint (manually)

```bash
curl -X POST https://trademint-backend.vercel.app/cron/check-expiry \
  -H "Authorization: Bearer your-cron-secret"
```

---

## Step 8: Update CORS (If Needed)

If you encounter CORS errors, update `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://trademint-frontend.vercel.app",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Redeploy backend after changes.

---

## Environment Variables Summary

### Backend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SECRET_KEY` | JWT secret key | `openssl rand -hex 32` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | `8358386533:AAG-zmUuY...` |
| `RAZORPAY_KEY_ID` | Razorpay API key | `rzp_test_xxxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | `your_secret` |
| `CRON_SECRET` | Cron job authorization | Random string |
| `VERCEL` | Flag for serverless mode | `1` |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://trademint-backend.vercel.app` |

---

## Monitoring & Logs

### View Logs

1. Go to Vercel Dashboard → Your Project → Logs
2. See real-time logs for all requests
3. Check for errors or warnings

### Monitor Cron Jobs

1. Go to Project → Cron Jobs tab
2. View execution history
3. Check success/failure status

---

## Limitations & Considerations

### Vercel Free Tier

- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ⚠️ 10-second function timeout
- ⚠️ No persistent storage (use cloud storage for uploads)

### Database Connections

- PostgreSQL has connection limits
- Consider connection pooling for production
- Neon free tier: 100 concurrent connections

### File Uploads (Certificates)

Current implementation uses local storage, which won't work on Vercel.

**Solution: Vercel Blob Storage**

1. Install package:
```bash
npm i @vercel/blob
```

2. Update upload logic in `app/routers/traders.py`:
```python
from vercel_blob import put

# Instead of saving locally
blob = await put(filename, file_content, {
    'access': 'public',
    'token': os.getenv('BLOB_READ_WRITE_TOKEN')
})
trader.sebi_certificate = blob['url']
```

3. Add `BLOB_READ_WRITE_TOKEN` to environment variables

---

## Troubleshooting

### Issue: Database Connection Failed

**Solution**: Check `DATABASE_URL` format:
- Must start with `postgresql://` (not `postgres://`)
- Include `?sslmode=require` for cloud databases

### Issue: 500 Internal Server Error

**Solution**: Check Vercel logs:
```bash
vercel logs trademint-backend
```

### Issue: Frontend Can't Connect to Backend

**Solution**: 
1. Check `VITE_API_URL` in frontend environment variables
2. Verify CORS settings in backend
3. Check Network tab in browser DevTools

### Issue: Cron Job Not Running

**Solution**:
1. Check `CRON_SECRET` is set correctly
2. View Cron Job logs in Vercel dashboard
3. Test endpoint manually with curl

---

## Local Development

You can still develop locally with SQLite:

```bash
# Backend
cd TradeMint
python -m uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev
```

The code automatically detects if running on Vercel (via `VERCEL` env var) and adjusts behavior.

---

## Deploy Updates

Push to GitHub to trigger automatic deployments:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build and deploy backend
3. Build and deploy frontend

---

## Next Steps

1. ✅ **Custom Domain**: Add your domain in Vercel settings
2. ✅ **SSL Certificate**: Automatically provided by Vercel
3. ✅ **Analytics**: Enable Vercel Analytics for insights
4. ✅ **Monitoring**: Setup error tracking (Sentry)
5. ✅ **Backups**: Schedule database backups

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Discord**: https://vercel.com/discord
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## Production Checklist

- [ ] PostgreSQL database created and connected
- [ ] All environment variables set in Vercel
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Database tables created and seeded
- [ ] Cron jobs configured and tested
- [ ] CORS properly configured
- [ ] Test all authentication flows
- [ ] Test payment integration
- [ ] Test Telegram alert delivery
- [ ] Monitor logs for errors
- [ ] Setup custom domain (optional)
- [ ] Enable Vercel Analytics (optional)

---

## Estimated Deployment Time

- Database setup: 10 minutes
- Backend deployment: 5 minutes
- Frontend deployment: 5 minutes
- Testing & verification: 10 minutes

**Total: ~30 minutes**

🎉 **Your TradeMint application is now live on Vercel!**
