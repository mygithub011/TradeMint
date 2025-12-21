# Smart Trade Frontend - Quick Start Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Start Backend
Open a terminal and run:
```bash
cd backend
uvicorn main:app --reload
```
Backend will run at: http://127.0.0.1:8000

### Step 2: Start Frontend
Open another terminal and run:
```bash
cd frontend
npm install
npm run dev
```
Frontend will run at: http://localhost:5173

### Step 3: Test the Application

#### Create Admin User (First Time Only)
You need an admin user to approve traders. Run in backend:
```bash
# In backend directory
python -c "from database import SessionLocal; from models import User; from auth import get_password_hash; db = SessionLocal(); admin = User(email='admin@test.com', hashed_password=get_password_hash('admin123'), role='admin', is_approved=True); db.add(admin); db.commit(); print('Admin created!')"
```

Or use this simple Python script:
```python
# create_admin.py
from database import SessionLocal
from models import User
from auth import get_password_hash

db = SessionLocal()
admin = User(
    email='admin@test.com',
    hashed_password=get_password_hash('admin123'),
    role='admin',
    is_approved=True
)
db.add(admin)
db.commit()
print('✅ Admin user created: admin@test.com / admin123')
db.close()
```

## 🧪 Testing Workflow

### 1. Register Trader
1. Go to http://localhost:5173/register
2. Fill in:
   - Email: `trader@test.com`
   - Password: `test123`
   - Role: Select "Trader"
3. Click "Sign Up"

### 2. Approve Trader (Admin)
1. Go to http://localhost:5173/login
2. Login with admin credentials:
   - Email: `admin@test.com`
   - Password: `admin123`
3. Go to Admin Panel
4. Approve the trader

### 3. Trader Creates Service
1. Logout and login as trader:
   - Email: `trader@test.com`
   - Password: `test123`
2. Click "Create Service"
3. Fill in service details:
   - Name: "Premium Crypto Signals"
   - Description: "Daily crypto trading signals"
   - Price: 99
   - Duration: 30 days
4. Submit

### 4. Register Client
1. Logout
2. Register new user:
   - Email: `client@test.com`
   - Password: `test123`
   - Role: Select "Client"
3. Login automatically

### 5. Client Subscribes
1. Click "Browse Marketplace"
2. Find the trader's service
3. Click "Subscribe Now"
4. Check dashboard for active subscription

### 6. Trader Sends Alert
1. Logout and login as trader
2. Click "Send Alert"
3. Select service
4. Write alert message
5. Send to all subscribers

### 7. Client Receives Alert
1. Logout and login as client
2. Go to dashboard
3. See alert in "Recent Alerts" section

## 📱 Test Accounts

After setup, you'll have:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123 |
| Trader | trader@test.com | test123 |
| Client | client@test.com | test123 |

## ✅ Verification Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Admin user created
- [ ] Can register trader
- [ ] Admin can approve trader
- [ ] Trader can create service
- [ ] Service appears in marketplace
- [ ] Client can register
- [ ] Client can subscribe to service
- [ ] Subscription shows in client dashboard
- [ ] Trader can see subscriber
- [ ] Trader can send alerts
- [ ] Client receives alerts

## 🐛 Common Issues

### Issue: "Failed to connect to backend"
**Solution**: Make sure backend is running on port 8000
```bash
cd backend
uvicorn main:app --reload
```

### Issue: "Trader cannot login after registration"
**Solution**: Traders need admin approval first
1. Login as admin
2. Go to Admin Panel
3. Approve the trader
4. Trader can now login

### Issue: "Port 5173 already in use"
**Solution**: Kill the process or change port
```bash
# Windows PowerShell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Issue: "Tailwind styles not working"
**Solution**: Restart dev server
```bash
npm run dev
```

## 📞 Need Help?

If you encounter issues:
1. Check both backend and frontend terminal for errors
2. Verify backend database is created (`test.db`)
3. Check browser console for JavaScript errors
4. Ensure all dependencies are installed (`npm install`)

## 🎉 Success!

If you can complete all test steps above, your Smart Trade platform is fully functional! 🚀
