# Vercel Deployment Guide for TradeMint

## ⚠️ Important: Vercel Limitations for This Project

Vercel is **primarily designed for frontend apps and lightweight serverless functions**. Your TradeMint app has challenges:

1. **SQLite won't work** - Need PostgreSQL
2. **Background jobs (APScheduler) won't work** - Need Vercel Cron or external service
3. **File uploads need cloud storage** - Need Vercel Blob/S3/Cloudinary
4. **Telegram bot webhooks** - Need serverless adaptation

## Recommended Alternative: **Render or Railway**
For FastAPI + SQLite + background jobs, consider:
- **Render** (already configured, free tier available)
- **Railway** (easy setup, generous free tier)
- **Fly.io** (global deployment)

## If You Still Want Vercel:

### Step 1: Switch to PostgreSQL

Install PostgreSQL driver:
```bash
pip install psycopg2-binary
```

Update `requirements.txt`:
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9  # Add this
bcrypt==4.0.1
python-jose[cryptography]==3.3.0
python-multipart==0.0.6
python-telegram-bot==20.7
pydantic==2.5.3
pydantic-settings==2.1.0
python-dotenv==1.0.0
email-validator==2.3.0
razorpay==1.4.1
```

Update `app/utils/config.py`:
```python
# Change DATABASE_URL from SQLite to PostgreSQL
DATABASE_URL: str = os.getenv(
    "DATABASE_URL", 
    "postgresql://user:password@host:5432/database"
)
```

**Get Free PostgreSQL:**
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres
- Neon: https://neon.tech (generous free tier)
- Supabase: https://supabase.com (includes auth & storage)

### Step 2: Adapt Backend for Serverless

Create `api/index.py` (Vercel serverless entry point):
```python
from app.main import app
import uvicorn

# Vercel serverless handler
handler = app

# For local testing
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Update `app/main.py` - Remove scheduler from startup:
```python
# Comment out or remove:
# @app.on_event("startup")
# async def startup_event():
#     start_scheduler()
```

### Step 3: File Storage Migration

**Option A: Vercel Blob Storage**
```bash
npm i @vercel/blob
```

Create `app/services/storage.py`:
```python
import os
from vercel_blob import put, del_

async def upload_certificate(file_content: bytes, filename: str):
    blob = await put(filename, file_content, {
        'access': 'public',
        'token': os.getenv('BLOB_READ_WRITE_TOKEN')
    })
    return blob['url']
```

**Option B: Cloudinary** (easier)
```bash
pip install cloudinary
```

### Step 4: Background Jobs with Vercel Cron

Update `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-expiry",
      "schedule": "0 * * * *"
    }
  ]
}
```

Create `app/routers/cron.py`:
```python
from fastapi import APIRouter, Header, HTTPException

router = APIRouter(prefix="/cron", tags=["cron"])

@router.post("/check-expiry")
async def check_expiry_cron(authorization: str = Header(None)):
    # Verify Vercel Cron secret
    if authorization != f"Bearer {os.getenv('CRON_SECRET')}":
        raise HTTPException(status_code=401)
    
    # Run expiry check logic
    check_expired_subscriptions()
    return {"status": "ok"}
```

### Step 5: Update Frontend API Base URL

Update `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://your-app.vercel.app/api' 
  : 'http://localhost:8000';
```

Create `frontend/.env.production`:
```
VITE_API_URL=https://your-app-name.vercel.app/api
```

### Step 6: Environment Variables in Vercel

Go to Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:pass@host:5432/db
SECRET_KEY=your-secret-key-here
TELEGRAM_BOT_TOKEN=8358386533:AAG-zmUuYFUMF0Mq5LX6Vq7TzB-PLW9lpZM
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
CRON_SECRET=random-secret-for-cron
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

### Step 7: Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## ⚠️ Limitations on Vercel:

1. **10-second timeout** for serverless functions (hobby plan)
2. **No persistent filesystem** - all uploads need cloud storage
3. **No long-running processes** - scheduler needs external solution
4. **Cold starts** - first request may be slow

## 🎯 Recommended: Use Render Instead

Your app is **already configured for Render** with:
- ✅ `render.yaml` configured
- ✅ Supports SQLite
- ✅ Background workers for APScheduler
- ✅ Persistent disk for file uploads
- ✅ Free tier available

**Deploy to Render:**
```bash
# 1. Push to GitHub
git push origin main

# 2. Go to render.com → New → Web Service
# 3. Connect GitHub repo
# 4. Render auto-detects render.yaml
# 5. Click "Create Web Service"
```

## Comparison:

| Feature | Vercel | Render |
|---------|--------|--------|
| SQLite Support | ❌ | ✅ |
| Background Jobs | ⚠️ Cron only | ✅ Workers |
| File Uploads | ⚠️ Need Blob | ✅ Disk |
| FastAPI | ⚠️ Serverless | ✅ Native |
| Free Tier | ✅ Good | ✅ Good |
| Setup Complexity | 🔴 High | 🟢 Low |

## My Recommendation:

**Use Render for backend + Vercel for frontend only:**

1. **Deploy Backend to Render** (already configured)
2. **Deploy Frontend to Vercel** separately
3. Update frontend API URL to Render backend

This gives you:
- ✅ Best of both platforms
- ✅ Minimal code changes
- ✅ All features work (SQLite, scheduler, uploads)
- ✅ Free tier for both

Want me to help you with this hybrid approach instead?
