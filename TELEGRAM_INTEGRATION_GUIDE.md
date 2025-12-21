# Telegram "One Group Per Service" Integration

## Overview

This implementation provides a scalable Telegram integration where each trading service has **one dedicated Telegram group** that all active subscribers are added to automatically.

### Key Benefits
✅ **Simplified management** - One group per service, not per user-service pair  
✅ **Automatic user management** - Users added on purchase, removed on expiry  
✅ **Efficient broadcasting** - All alerts sent to one group, reaching all subscribers instantly  
✅ **Better scalability** - No complexity of managing thousands of individual groups  
✅ **Audit trail** - All alerts logged in database for compliance  

---

## Architecture

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE FLOW                               │
└─────────────────────────────────────────────────────────────────┘

1. TRADER CREATES SERVICE
   └─> Sets up trading service (name, price, duration)

2. TRADER CREATES TELEGRAM GROUP
   └─> One dedicated group per service
   └─> Bot becomes admin, controls message posting
   └─> Generates permanent invite link

3. USER PURCHASES SERVICE  
   └─> Subscription created immediately
   └─> User gets invite link via email (can be automated)
   └─> User joins Telegram group

4. TRADER SENDS ALERT
   └─> Message sent to service's Telegram group
   └─> ALL active subscribers receive it instantly
   └─> Alert logged in database

5. SUBSCRIPTION EXPIRES
   └─> Scheduler detects expired subscription
   └─> User automatically removed from group
   └─> Can rejoin if they resubscribe
```

### Database Schema

**Service Model** (NEW/UPDATED fields)
```python
telegram_group_id: str        # Telegram chat ID (internal ID)
telegram_group_link: str      # Shareable invite URL
```

**Subscription Model** (EXISTING field)
```python
telegram_user_id: str         # User's Telegram ID (required to add/remove from group)
```

---

## Setup Instructions

### 1. Prerequisites

- Telegram Bot Token (get from @BotFather)
- Telegram group created manually or via API
- Bot must be admin in the group

### 2. Environment Variables

Add to `.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### 3. Database Migration

The `telegram_group_link` field is new. Create migration:

```bash
# Generate migration
alembic revision --autogenerate -m "Add telegram_group_link to services"

# Apply migration
alembic upgrade head
```

If not using Alembic, run raw SQL:
```sql
ALTER TABLE services ADD COLUMN telegram_group_link VARCHAR(500) NULL;
```

---

## API Endpoints

### Trader Endpoints (for managing groups)

#### 1. Create Telegram Group for Service
```
POST /traders/services/{service_id}/telegram-group/create

Response:
{
  "status": "success",
  "service_id": 1,
  "service_name": "Equity Intraday",
  "group_id": "-123456789",
  "invite_link": "https://t.me/+AbCdEfG1234",
  "message": "Telegram group created successfully..."
}
```

#### 2. Get Group Information
```
GET /traders/services/{service_id}/telegram-group/info

Response:
{
  "status": "success",
  "service_id": 1,
  "group_id": "-123456789",
  "invite_link": "https://t.me/+AbCdEfG1234",
  "bot_is_admin": true,
  "active_subscribers": 45,
  "group_info": {
    "title": "🔔 Equity Intraday - trader_name",
    "description": "Trading alerts...",
    "members_count": 46  // 45 users + bot
  }
}
```

#### 3. Send Test Alert
```
POST /traders/services/{service_id}/telegram-group/test-alert

Query Parameters:
?message=Your+test+message+here

Response:
{
  "status": "success",
  "message": "Test alert sent successfully to the group"
}
```

#### 4. Generate New Invite Link
```
POST /traders/services/{service_id}/telegram-group/generate-link

Query Parameters:
?is_permanent=true   # true for reusable, false for single-use

Response:
{
  "status": "success",
  "invite_link": "https://t.me/+AbCdEfG1234",
  "type": "permanent",
  "message": "Invite link generated successfully"
}
```

### Alert Endpoint

#### Send Trade Alert (broadcasts to entire group)
```
POST /alerts

Request Body:
{
  "service_id": 1,
  "message": "Strong buy signal on RELIANCE",
  "stock_symbol": "RELIANCE",
  "action": "BUY",
  "target_price": "2850",
  "stop_loss": "2750"
}

Behavior:
- Alert saved to database
- Message formatted and sent to service's Telegram group
- ALL active subscribers receive it immediately
- Logged for audit trail
```

### Subscription Endpoints

#### Create Subscription (automatically adds to group)
```
POST /subscriptions

Request Body:
{
  "service_id": 1,
  "telegram_user_id": "123456789"  // User's Telegram ID
}

Behavior:
- Subscription created
- User added to service's Telegram group (via invite link)
- User receives message in group (if notifications enabled)
```

#### Cancel Subscription (removes from group)
```
POST /subscriptions/{subscription_id}/cancel

Behavior:
- Subscription marked CANCELLED
- User removed from group immediately
```

---

## User Flow (Frontend Implementation)

### Step 1: Service Purchase Page
```jsx
function PurchaseService({ service }) {
  const [telegramId, setTelegramId] = useState('');
  
  const handlePurchase = async () => {
    // 1. Get user's Telegram ID
    // 2. Send subscription request with telegram_user_id
    const response = await createSubscription({
      service_id: service.id,
      telegram_user_id: telegramId
    });
    
    // 3. Show invite link or message
    alert(`Join group: ${response.telegram_group_link}`);
  };
  
  return (
    <div>
      <input 
        placeholder="Your Telegram User ID" 
        value={telegramId}
        onChange={(e) => setTelegramId(e.target.value)}
      />
      <button onClick={handlePurchase}>Purchase</button>
    </div>
  );
}
```

### Step 2: After Purchase
- User receives email with invite link
- User clicks link and joins Telegram group
- User sees welcome message with instructions

### Step 3: Service Expiry
- Scheduler runs every X minutes
- Finds expired subscriptions
- Removes users from group automatically
- Optional: Send notification before expiry

---

## File Structure & Changes

### New Files Created
```
app/services/telegram_group_manager.py
  ├─ TelegramGroupManager class
  ├─ create_service_group()
  ├─ add_user_to_service_group()
  ├─ remove_user_from_service_group()
  ├─ send_alert_to_service_group()
  └─ Helper methods for group management
```

### Modified Files
```
app/models/models.py
  ├─ Service model: Added telegram_group_link field

app/routers/subscriptions.py
  ├─ Updated create_subscription() to add users to group
  ├─ Updated cancel_subscription() to remove users
  ├─ Now uses telegram_group_manager

app/routers/alerts.py
  ├─ Updated send_trade_alert() to broadcast to service group
  ├─ All subscribers receive alert via one group

app/routers/traders.py
  ├─ Added create_telegram_group_for_service()
  ├─ Added get_telegram_group_info()
  ├─ Added send_test_alert()
  ├─ Added generate_group_invite_link()

app/services/expiry_service.py
  ├─ Updated check_and_expire_subscriptions()
  ├─ Removes users from group on expiry
  ├─ Now uses telegram_group_manager
```

---

## Logging & Monitoring

All operations are logged at INFO level:

```python
logger.info(f"Created Telegram group {group_id} for service {service.name}")
logger.info(f"Alert {alert_id} sent to {service.name} group")
logger.info(f"Removed user {user_id} from service group {service.name}")
logger.warning(f"Failed to generate invite link for group {group_id}")
logger.error(f"Error sending Telegram alert: {e}")
```

Check logs:
```bash
# Docker
docker logs -f <container_name>

# Local
tail -f logs/app.log
```

---

## Troubleshooting

### Issue: Bot not admin in group
**Solution**: Make bot admin manually via Telegram, or use `verify_bot_admin_in_group()` endpoint

### Issue: Users not receiving invites
**Solution**: 
- Ensure `telegram_user_id` is correct (numeric, not username)
- Check bot has permission to create invite links
- Verify group is not private without bot as admin

### Issue: Alerts not being sent
**Solution**:
- Check `telegram_group_id` is stored correctly (format: `-123456789`)
- Verify bot is admin and can post messages
- Check bot permissions in group settings

### Issue: Users not auto-removed on expiry
**Solution**:
- Verify scheduler is running: Check logs for "Expiry check will run every X minutes"
- Check `check_and_expire_subscriptions()` runs correctly
- Verify Telegram bot token is valid

---

## Best Practices

✅ **Use single-use invite links for security** - User gets unique link, can't be shared  
✅ **Send welcome message when user joins** - Via bot, explain group rules  
✅ **Log all alerts in database** - For audit and replay capability  
✅ **Test group creation first** - Use test alert endpoint before sending real alerts  
✅ **Monitor group membership** - Check active_subscribers count regularly  
✅ **Have backup communication** - Email notifications as fallback  
✅ **Set group permissions** - Only bot/admin can post, others receive-only  

---

## Example Workflow

### 1. Trader Creates Service
```bash
# Service details
Name: "Equity Intraday"
Price: ₹999
Duration: 30 days
Description: "Get daily equity trading signals"
```

### 2. Trader Creates Telegram Group
```
POST /traders/services/1/telegram-group/create

Response:
{
  "group_id": "-1001234567890",
  "invite_link": "https://t.me/+AbCdEfG1234567"
}
```

### 3. Multiple Users Purchase Service
```
User A at 10 AM:
  POST /subscriptions
  Body: { service_id: 1, telegram_user_id: "111111" }
  → Added to group

User B at 9 PM (same day):
  POST /subscriptions
  Body: { service_id: 1, telegram_user_id: "222222" }
  → Added to same group
```

### 4. Trader Sends Alert
```
POST /alerts
Body: {
  service_id: 1,
  message: "BUY RELIANCE at market open",
  stock_symbol: "RELIANCE",
  action: "BUY",
  target_price: "2850"
}

Result:
- Alert saved to database
- Message posted to group
- Both User A and User B see the alert instantly
```

### 5. After 30 Days - Expiry
```
Scheduler runs:
- Finds subscription for User A (expired)
- Marks subscription EXPIRED
- Removes User A from group
- User A can still see old messages but can't access new ones

User A can:
- Resubscribe to rejoin group
- Purchase another service
```

---

## Performance Considerations

| Metric | Handling |
|--------|----------|
| **Large groups (1000+ users)** | Single group efficient; Telegram handles large groups well |
| **High frequency alerts** | Rate limited by Telegram API (~30 msg/sec per bot) |
| **User removal on expiry** | Scheduled async task, non-blocking |
| **Invite link generation** | Cached and reused; single-use links unique per user |

---

## Security Considerations

- **Telegram User IDs** are not sensitive (public when messaging bot)
- **Group IDs** kept in database, not exposed to frontend
- **Invite links** should be private (sent via email, not SMS)
- **Bot token** never exposed to frontend (backend only)
- **Message content** stored in database for audit

---

## Future Enhancements

- 📝 **Message pinning** - Important alerts pinned automatically
- 🔔 **Pre-expiry notifications** - Alert user 1 day before expiry
- 📊 **Group analytics** - Messages per day, subscriber growth charts
- 🤖 **Automated responses** - Bot answers common questions
- 🔗 **Group linking** - Connect related services to one "umbrella" group
- 💬 **Subscriber feedback** - Collect ratings via bot reactions

---

## Support & Debugging

Enable debug logging:
```python
# In config.py
LOG_LEVEL = "DEBUG"
```

Check specific operations:
```python
# Test bot connection
curl "http://localhost:8000/traders/services/1/telegram-group/info"

# Test group creation
curl -X POST "http://localhost:8000/traders/services/1/telegram-group/create"

# Send test alert
curl -X POST "http://localhost:8000/traders/services/1/telegram-group/test-alert?message=Test"
```

---

**Last Updated**: December 21, 2025  
**Version**: 1.0  
**Implementation Status**: ✅ Complete
