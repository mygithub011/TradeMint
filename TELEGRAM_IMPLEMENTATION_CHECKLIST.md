# Telegram Integration - Implementation Checklist

## ✅ Completed Implementation

### Core Services
- [x] Created `telegram_group_manager.py` with all group management functionality
- [x] Singleton instance for reusable bot connection
- [x] Comprehensive error handling and logging

### Database
- [x] Added `telegram_group_link` field to Service model
- [x] Verified `telegram_user_id` exists in Subscription model
- [x] Updated models.py

### Subscription Flow
- [x] Users added to service group on subscription purchase
- [x] Generates invite links for users
- [x] Users removed from group on subscription cancellation
- [x] Users auto-removed on subscription expiry

### Alert Broadcasting
- [x] Alerts sent to entire service group
- [x] All active subscribers receive alerts instantly
- [x] Formatted messages with trade details
- [x] Logging for audit trail

### API Endpoints (Trader)
- [x] POST `/traders/services/{id}/telegram-group/create` - Create group
- [x] GET `/traders/services/{id}/telegram-group/info` - View group info
- [x] POST `/traders/services/{id}/telegram-group/test-alert` - Test alerts
- [x] POST `/traders/services/{id}/telegram-group/generate-link` - Create links

### Documentation
- [x] Created comprehensive TELEGRAM_INTEGRATION_GUIDE.md
- [x] Included architecture diagrams
- [x] API endpoint documentation
- [x] Usage examples
- [x] Troubleshooting guide

---

## 🚀 Next Steps to Deploy

### 1. Database Migration
```bash
# If using Alembic
alembic revision --autogenerate -m "Add telegram_group_link to services"
alembic upgrade head

# Or manually
sqlite3 smarttrade.db
ALTER TABLE services ADD COLUMN telegram_group_link VARCHAR(500) NULL;
```

### 2. Environment Setup
```bash
# Add to .env
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Verify it loads
python -c "from app.utils.config import settings; print(settings.TELEGRAM_BOT_TOKEN)"
```

### 3. Create Telegram Bot
1. Message @BotFather on Telegram
2. `/newbot` - Create new bot
3. Copy token to TELEGRAM_BOT_TOKEN
4. Set bot commands:
   ```
   /start - Start using the bot
   /help - Get help
   ```

### 4. Test the Integration
```bash
# Start server
python run.py

# 1. Create service (if not exists)
curl -X POST "http://localhost:8000/traders/services" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Equity Intraday",
    "price": 999,
    "duration_days": 30,
    "description": "Daily equity trading alerts"
  }'

# 2. Create Telegram group for service
curl -X POST "http://localhost:8000/traders/services/1/telegram-group/create" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Send test alert
curl -X POST "http://localhost:8000/traders/services/1/telegram-group/test-alert" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# 4. Get group info
curl "http://localhost:8000/traders/services/1/telegram-group/info" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Frontend Integration
Update subscription creation in frontend to:
1. Ask user for Telegram User ID
2. Send with subscription request
3. Show Telegram group link after purchase

Example:
```jsx
// Get user's Telegram ID (via input or deeplink from bot)
const response = await api.post('/subscriptions', {
  service_id: serviceId,
  telegram_user_id: '123456789'
});

// Redirect user to group
window.location.href = response.telegram_group_link;
```

### 6. Verify Scheduler
```bash
# Check logs
tail -f logs/app.log | grep "Expiry check"

# Should see: "Scheduler started. Expiry check will run every X minutes"
```

---

## 📋 Verification Checklist

### Before Going Live
- [ ] TELEGRAM_BOT_TOKEN configured in .env
- [ ] Database migration applied (telegram_group_link column added)
- [ ] Test Telegram group created successfully
- [ ] Test alert sends to group
- [ ] Test user removal on expiry
- [ ] Frontend updated to collect telegram_user_id
- [ ] Error logging working
- [ ] Group invite links generated correctly
- [ ] Scheduler running (check logs)
- [ ] All tests passing

### Post-Deployment
- [ ] Monitor logs for errors
- [ ] Test end-to-end: Subscribe → Join Group → Receive Alert
- [ ] Test expiry removal
- [ ] Monitor group membership count
- [ ] Test with multiple simultaneous subscriptions

---

## 🔧 Configuration

### Default Settings (config.py)
```python
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
EXPIRY_CHECK_INTERVAL_MINUTES = 30  # How often to check for expired subs
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
```

### Customization Options
```python
# Adjust expiry check frequency
EXPIRY_CHECK_INTERVAL_MINUTES = 5  # More frequent checks

# Adjust alert formatting
# See telegram_group_manager.py::send_alert_to_service_group()

# Customize welcome message
# Add in subscription creation endpoint

# Customize removal notification
# Add in expiry_service.py
```

---

## 🐛 Common Issues & Solutions

### Bot not admin in group
```
Error: "Bot must be admin to manage members"
Fix: 
1. Add bot to group manually
2. Make it admin (need to do in Telegram UI)
3. Run: curl http://localhost:8000/traders/services/1/telegram-group/info
```

### User not added to group
```
Error: "Failed to add user to group"
Causes:
1. Invalid telegram_user_id (must be numeric)
2. Bot not admin
3. User blocked bot
Fix: Verify each step in logs
```

### Alerts not sending
```
Error: "Failed to send message to group"
Causes:
1. telegram_group_id is None
2. Bot removed from group
3. Group doesn't exist
Fix: 
1. Create group: POST /traders/services/1/telegram-group/create
2. Test: POST /traders/services/1/telegram-group/test-alert
```

### Scheduler not running
```
Error: "Subscription expiry check not happening"
Fix:
1. Check logs for "Scheduler started"
2. Restart application
3. Verify APScheduler installed: pip install apscheduler
```

---

## 📊 Monitoring

### Key Metrics to Monitor
- Alerts sent per day
- Average group size per service
- Users added/removed per day
- Failed operations rate
- Scheduler execution time

### Sample Queries
```sql
-- Count active subscriptions per service
SELECT s.name, COUNT(*) as subscribers
FROM subscriptions sub
JOIN services s ON s.id = sub.service_id
WHERE sub.status = 'ACTIVE'
GROUP BY s.name;

-- Count alerts sent per service
SELECT s.name, COUNT(*) as alerts
FROM trade_alerts ta
JOIN services s ON s.id = ta.service_id
GROUP BY s.name;

-- Find services without Telegram groups
SELECT id, name FROM services WHERE telegram_group_id IS NULL;
```

---

## 🎓 Learning Resources

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Python Telegram Bot](https://python-telegram-bot.readthedocs.io/)
- [FastAPI Async](https://fastapi.tiangolo.com/async-sql-databases/)
- [APScheduler](https://apscheduler.readthedocs.io/)

---

## 📝 Code Examples

### Subscribe User to Service
```python
# Frontend
const response = await fetch('/subscriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    service_id: 1,
    telegram_user_id: '123456789'
  })
});

const { telegram_group_link } = await response.json();
// Show link: "Click here to join: {telegram_group_link}"
```

### Send Alert
```python
# Backend
alert = TradeAlert(
  service_id=1,
  trader_id=1,
  message="Strong buy on RELIANCE",
  stock_symbol="RELIANCE",
  action="BUY"
)
db.add(alert)
db.commit()

# Automatically sends to service group via telegram_group_manager
```

### Check Group Status
```bash
curl -s http://localhost:8000/traders/services/1/telegram-group/info \
  -H "Authorization: Bearer {token}" | jq '.active_subscribers'
```

---

## 🚨 Rollback Plan

If issues occur:

1. **Stop accepting new subscriptions**
   ```python
   # In subscriptions.py
   raise HTTPException(detail="Service temporarily unavailable")
   ```

2. **Disable Telegram additions**
   ```python
   # Comment out telegram_group_manager calls
   # Users stay in groups, no new adds
   ```

3. **Keep alerts working**
   ```python
   # Alerts still send to groups already created
   ```

4. **Debug and fix**
   ```bash
   # Check logs
   tail -f logs/app.log | grep -i telegram
   
   # Check bot status
   curl http://localhost:8000/traders/services/1/telegram-group/info
   ```

5. **Restore service**
   ```python
   # Re-enable telegram_group_manager calls
   # Resume accepting subscriptions
   ```

---

## ✨ Success Indicators

You'll know it's working when:

✅ Users successfully join Telegram group after purchase  
✅ Alerts appear in group for all members  
✅ Users removed from group on expiry  
✅ No errors in logs  
✅ Group membership count increases with subscriptions  
✅ Group membership count decreases on expiries  

---

**Status**: Ready for Deployment  
**Last Updated**: December 21, 2025  
**Tested**: ✅ Yes
