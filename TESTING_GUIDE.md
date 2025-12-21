# Smart Trade - Quick Testing Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Setup
```powershell
cd backend
.\setup.ps1
```

### Step 2: Start Server
```powershell
uvicorn app.main:app --reload
```

### Step 3: Seed Test Data (Optional)
```powershell
python app\seed.py
```

Then open: http://127.0.0.1:8000/docs

---

## 📝 Test Credentials (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smarttrade.com | admin123 |
| Trader | trader@example.com | trader123 |
| Client | client@example.com | client123 |

---

## 🧪 Complete Testing Flow

### 1. Authentication

**Register Admin** (if not seeded)
```json
POST /auth/register
{
  "email": "admin@smarttrade.com",
  "password": "admin123",
  "role": "admin"
}
```

**Login**
```json
POST /auth/login
{
  "username": "admin@smarttrade.com",
  "password": "admin123"
}
```

**Copy the `access_token` and click "Authorize" button → Enter: `Bearer <token>`**

---

### 2. Trader Onboarding Flow

**Register Trader**
```json
POST /auth/register
{
  "email": "john.trader@example.com",
  "password": "secure123",
  "role": "trader"
}
```

**Login as Trader**
```json
POST /auth/login
{
  "username": "john.trader@example.com",
  "password": "secure123"
}
```

**Authorize with trader token**

**Onboard as Trader**
```json
POST /traders/onboard
{
  "sebi_reg": "INH000005678"
}
```
*Optional: Upload certificate file*

**Login as Admin and Approve Trader**
```json
POST /admin/traders/{trader_id}/approve
```
Get trader_id from pending traders:
```json
GET /admin/traders/pending
```

---

### 3. Service Creation (As Approved Trader)

**Create Service**
```json
POST /traders/services
{
  "name": "Equity Intraday Premium",
  "description": "Daily intraday calls with 80%+ accuracy",
  "price": 5000,
  "duration_days": 30,
  "telegram_group_id": "-1001234567890"
}
```

**View My Services**
```json
GET /traders/services
```

---

### 4. Client Subscription Flow

**Register Client**
```json
POST /auth/register
{
  "email": "client@example.com",
  "password": "client123",
  "role": "client"
}
```

**Login as Client**
```json
POST /auth/login
{
  "username": "client@example.com",
  "password": "client123"
}
```

**Browse Available Services**
```json
GET /services/
```

**Subscribe to a Service**
```json
POST /subscriptions/
{
  "service_id": 1,
  "telegram_user_id": "123456789"
}
```

**View My Subscriptions**
```json
GET /subscriptions/
```

---

### 5. Trade Alerts (As Trader)

**Send Trade Alert**
```json
POST /alerts/
{
  "service_id": 1,
  "message": "BUY Reliance Industries at CMP (2800). Target: 2900, Stop Loss: 2750",
  "stock_symbol": "RELIANCE",
  "action": "BUY",
  "target_price": "2900",
  "stop_loss": "2750"
}
```

**View My Alerts**
```json
GET /alerts/my-alerts
```

---

### 6. Admin Operations

**View System Stats**
```json
GET /admin/stats
```

**Get All Subscriptions**
```json
GET /admin/subscriptions
```

**Manually Trigger Expiry Check**
```json
POST /admin/subscriptions/check-expiry
```

**Deactivate a Service**
```json
POST /admin/services/{service_id}/deactivate
```

**Revoke Trader Approval**
```json
POST /admin/traders/{trader_id}/revoke
```

---

## 🔍 Verification Tests

### Test 1: Role-Based Access Control
1. Login as client
2. Try to create service (should fail with 403)
3. Try to approve trader (should fail with 403)

### Test 2: Trader Approval Workflow
1. Onboard new trader
2. Try to create service without approval (should fail)
3. Admin approves trader
4. Create service successfully

### Test 3: Subscription Expiry
1. Create subscription
2. Wait or manually trigger expiry check
3. Verify subscription status changes to EXPIRED

### Test 4: Duplicate Prevention
1. Try to register with existing email (should fail)
2. Try to subscribe to same service twice (should fail)
3. Try to use duplicate SEBI registration (should fail)

---

## 📊 Key Endpoints Reference

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login (get token)
- `GET /auth/me` - Get current user

### Traders
- `POST /traders/onboard` - Onboard with SEBI
- `GET /traders/me` - My profile
- `POST /traders/services` - Create service
- `GET /traders/services` - My services

### Services
- `GET /services/` - List all services
- `GET /services/{id}` - Service details
- `GET /services/trader/{trader_id}` - Services by trader

### Subscriptions
- `POST /subscriptions/` - Purchase subscription
- `GET /subscriptions/` - My subscriptions
- `POST /subscriptions/{id}/cancel` - Cancel subscription

### Trade Alerts
- `POST /alerts/` - Send alert (trader)
- `GET /alerts/my-alerts` - My sent alerts

### Admin
- `POST /admin/traders/{id}/approve` - Approve trader
- `GET /admin/traders/pending` - Pending approvals
- `GET /admin/stats` - System statistics
- `POST /admin/subscriptions/check-expiry` - Manual expiry check

---

## 🐛 Troubleshooting

### Issue: Import errors
**Solution**: Install dependencies
```powershell
pip install -r requirements.txt
```

### Issue: Database locked
**Solution**: Close all connections and restart
```powershell
# Stop server (Ctrl+C)
# Delete database
rm smarttrade.db
# Restart server
```

### Issue: 401 Unauthorized
**Solution**: Check token authorization
1. Login to get token
2. Click "Authorize" in Swagger
3. Enter: `Bearer <your_token>`

### Issue: 403 Forbidden
**Solution**: Check user role
- Traders can't approve traders (admin only)
- Clients can't create services (trader only)
- Login with correct role user

### Issue: Telegram bot not working
**Solution**: Configure bot token
1. Edit .env file
2. Set `TELEGRAM_BOT_TOKEN=your_token`
3. Restart server

---

## ✅ Feature Checklist

- [x] User registration with role
- [x] JWT authentication
- [x] Password hashing
- [x] Trader SEBI onboarding
- [x] Certificate upload
- [x] Admin approval workflow
- [x] Service creation
- [x] Service listing
- [x] Subscription purchase
- [x] Subscription expiry
- [x] Telegram integration
- [x] Trade alerts
- [x] Admin panel
- [x] Background scheduler
- [x] Role-based access control
- [x] API documentation

---

## 📞 Support

For issues:
1. Check Swagger docs: http://127.0.0.1:8000/docs
2. Review README.md
3. Check application logs
4. Verify database entries

---

**Happy Testing! 🎉**
