# Telegram "One Group Per Service" - Quick Start Guide

## 🚀 30-Minute Setup

### Step 1: Get Telegram Bot Token (2 min)
1. Open Telegram, search for **@BotFather**
2. Send `/newbot`
3. Follow prompts, copy the token (looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
4. Done! ✓

### Step 2: Configure Your App (2 min)
```bash
# Edit .env file
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Restart app
python run.py
```

### Step 3: Create Your First Service (3 min)
If you don't have a service yet:
```bash
# Create service via API
curl -X POST http://localhost:8000/traders/services \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Equity Intraday",
    "price": 999,
    "duration_days": 30,
    "description": "Daily equity signals"
  }'

# Note: Save the service ID (e.g., 1)
```

### Step 4: Create Telegram Group (5 min)
```bash
# Create group for service 1
curl -X POST http://localhost:8000/traders/services/1/telegram-group/create \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response includes:
# - group_id: -1001234567890
# - invite_link: https://t.me/+AbCdEf...
```

### Step 5: Send Test Alert (2 min)
```bash
# Test that alerts work
curl -X POST http://localhost:8000/traders/services/1/telegram-group/test-alert \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check Telegram group - message should appear!
```

### Step 6: Test Full Workflow (10 min)
```bash
# 1. Get your Telegram User ID
#    Add bot to DM and send /start
#    Check console logs for your ID (format: 123456789)

# 2. Create subscription
curl -X POST http://localhost:8000/subscriptions \
  -H "Authorization: Bearer CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1,
    "telegram_user_id": "123456789"
  }'

# 3. Join group using link from response

# 4. Send real alert
curl -X POST http://localhost:8000/alerts \
  -H "Authorization: Bearer TRADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1,
    "message": "BUY RELIANCE",
    "stock_symbol": "RELIANCE",
    "action": "BUY",
    "target_price": "2850"
  }'

# 5. See alert in Telegram group! ✓
```

---

## 🎯 How It Works (Simple)

```
┌─────────────────────────────────────────────────────┐
│  USER PURCHASES SERVICE AT 10 AM                    │
│  → Added to service's Telegram group                │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│  ANOTHER USER PURCHASES SAME SERVICE AT 9 PM        │
│  → Added to SAME group                              │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│  TRADER SENDS ALERT                                 │
│  → Sent to group (both users receive instantly)     │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│  30 DAYS LATER - SUBSCRIPTION EXPIRES               │
│  → User auto-removed from group                     │
│  → User can rejoin by purchasing again              │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Files Modified/Created

### New Files
```
✨ app/services/telegram_group_manager.py      # Core Telegram logic
✨ TELEGRAM_INTEGRATION_GUIDE.md                # Full documentation  
✨ TELEGRAM_IMPLEMENTATION_CHECKLIST.md         # Setup checklist
✨ DATABASE_SCHEMA_TELEGRAM.md                  # Database details
```

### Modified Files
```
📝 app/models/models.py                         # Added telegram_group_link field
📝 app/routers/subscriptions.py                 # Auto-add users to group
📝 app/routers/alerts.py                        # Broadcast to group
📝 app/routers/traders.py                       # Group management endpoints
📝 app/services/expiry_service.py               # Auto-remove on expiry
```

---

## 🔌 API Quick Reference

### For Traders (Group Management)

**Create Group**
```
POST /traders/services/{id}/telegram-group/create
Returns: group_id, invite_link
```

**Check Group Status**
```
GET /traders/services/{id}/telegram-group/info
Returns: active_subscribers, bot_is_admin, invite_link
```

**Send Test Alert**
```
POST /traders/services/{id}/telegram-group/test-alert?message=Test%20message
```

**Generate Link**
```
POST /traders/services/{id}/telegram-group/generate-link?is_permanent=true
```

### For Clients (Using Telegram)

**Purchase Service**
```
POST /subscriptions
Body: { service_id: 1, telegram_user_id: "123456789" }
Returns: invite_link (join group here!)
```

**Cancel Service**
```
POST /subscriptions/{id}/cancel
Effect: Auto-removed from group
```

### For Traders (Send Alerts)

**Send Alert to Group**
```
POST /alerts
Body: { 
  service_id: 1,
  message: "Buy signal on RELIANCE",
  stock_symbol: "RELIANCE",
  action: "BUY"
}
Effect: Sent to service group, all subscribers see it
```

---

## ✅ Verify It Works

### Check 1: Bot Token Configured
```bash
python -c "from app.utils.config import settings; print('✓ Token OK' if settings.TELEGRAM_BOT_TOKEN else '✗ Token missing')"
```

### Check 2: Database Column Added
```bash
sqlite3 smarttrade.db "SELECT telegram_group_link FROM services LIMIT 1;" 2>/dev/null && echo "✓ Column exists" || echo "✗ Add column"
```

### Check 3: Service Group Created
```bash
curl http://localhost:8000/traders/services/1/telegram-group/info \
  -H "Authorization: Bearer YOUR_TOKEN" | grep -q "group_id" && echo "✓ Group exists" || echo "✗ Create group"
```

### Check 4: Send Test Alert
```bash
curl -X POST http://localhost:8000/traders/services/1/telegram-group/test-alert \
  -H "Authorization: Bearer YOUR_TOKEN" | grep -q "success" && echo "✓ Alerts work" || echo "✗ Check logs"
```

---

## 🐛 Quick Troubleshooting

### Bot not admin in group
```
Error: "Failed to send message to group"
Fix:
1. Go to Telegram group
2. Right-click bot name → "Make administrator"
3. Give: "Send Messages" permission
4. Try again
```

### User not added to group
```
Error: "Failed to add user"
Fix:
1. Verify telegram_user_id is numeric (e.g., "123456789" not "@username")
2. Get ID: Add bot to DM, check console logs
3. Try subscription again
```

### No test alert in group
```
Fix:
1. Verify bot is in group and admin
2. Check .env has TELEGRAM_BOT_TOKEN
3. Run: curl http://localhost:8000/traders/services/1/telegram-group/info
4. Look for "bot_is_admin": true
```

### Scheduler not removing expired users
```
Fix:
1. Check logs: "Expiry check will run every..."
2. Create subscription with end_date in past
3. Wait for scheduler or manually trigger:
   ```python
   from app.services.expiry_service import expiry_service
   expiry_service.check_and_expire_subscriptions()
   ```
```

---

## 📚 Full Documentation

For complete details, see:
- 📖 **TELEGRAM_INTEGRATION_GUIDE.md** - Full architecture & examples
- ✅ **TELEGRAM_IMPLEMENTATION_CHECKLIST.md** - Step-by-step setup
- 🗄️ **DATABASE_SCHEMA_TELEGRAM.md** - Database details

---

## 💡 Common Use Cases

### Case 1: Daily Trading Alerts
```
Service: "Equity Intraday"
├─ Group created
├─ 50 users subscribe
├─ Trader sends alert at market open
├─ All 50 see it instantly in group
└─ Users leave on expiry (30 days)
```

### Case 2: Multiple Services
```
Service 1: "Equity Intraday" → Group A → 100 users
Service 2: "F&O Swing"       → Group B → 50 users
Service 3: "Crypto Trading"  → Group C → 75 users

Trader can manage all independently
Each service has its own alerts & group
```

### Case 3: Resubscription
```
Day 1: User buys service → Joins group
Day 30: Subscription expires → Removed from group
Day 31: User buys again → Joins group again
         (Same group, fresh access)
```

---

## 🚀 Next Steps

1. **Setup**: Follow "30-Minute Setup" above
2. **Test**: Run "Verify It Works" checks
3. **Integrate Frontend**: Update subscription form to ask for telegram_user_id
4. **Go Live**: Deploy and monitor
5. **Scale**: Monitor group sizes and add more services

---

## 📞 Support

If issues occur:
1. Check logs: `tail -f logs/app.log | grep -i telegram`
2. Read troubleshooting section above
3. See full docs in TELEGRAM_INTEGRATION_GUIDE.md
4. Verify bot token in .env
5. Verify database column exists

---

**Ready?** Start with "30-Minute Setup" above! ✨

**Time to setup**: ~30 minutes  
**Time to test**: ~5 minutes  
**Status**: Production ready ✅
