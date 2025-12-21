# Database Schema - Telegram Integration

## Updated Models

### Service Model Changes
```python
class Service(Base):
    __tablename__ = "services"
    
    # ... existing fields ...
    name: str
    description: str
    price: int
    duration_days: int
    is_active: bool
    
    # NEW FIELDS FOR TELEGRAM
    telegram_group_id: str           # Telegram's internal chat ID (e.g., "-1001234567890")
    telegram_group_link: str         # Shareable invite link (e.g., "https://t.me/+AbCdEf...")
    
    # Relationships
    subscriptions = Subscription[]   # One service -> Many subscriptions
    trader = Trader                  # Many services -> One trader
```

### Subscription Model (No Changes Needed)
```python
class Subscription(Base):
    __tablename__ = "subscriptions"
    
    # Existing fields
    user_id: int                     # FK to User
    service_id: int                  # FK to Service
    start_date: datetime
    end_date: datetime
    status: str                      # "ACTIVE", "EXPIRED", "CANCELLED"
    
    # EXISTING FIELD (Already present, used by integration)
    telegram_user_id: str            # User's Telegram ID (e.g., "123456789")
    
    # Relationships
    user = User
    service = Service
```

### Trader Model (No Changes)
```python
class Trader(Base):
    __tablename__ = "traders"
    
    user_id: int                     # FK to User
    sebi_reg: str
    certificate_path: str
    approved: bool
    
    # Relationships
    user = User
    services = Service[]
```

### User Model (No Changes)
```python
class User(Base):
    __tablename__ = "users"
    
    email: str
    password: str
    role: str                        # "admin", "trader", "client"
    
    # Relationships
    trader = Trader
    subscriptions = Subscription[]
```

### TradeAlert Model (No Changes)
```python
class TradeAlert(Base):
    __tablename__ = "trade_alerts"
    
    service_id: int                  # FK to Service
    trader_id: int                   # FK to Trader
    message: str
    stock_symbol: str
    action: str                      # "BUY", "SELL", "HOLD"
    target_price: str
    stop_loss: str
    sent_at: datetime
```

---

## Data Flow Diagrams

### Subscription Flow
```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Purchase Service with telegram_user_id
       ▼
┌─────────────────────────────────────────────┐
│ POST /subscriptions                         │
│ Body: {                                     │
│   service_id: 1,                            │
│   telegram_user_id: "123456789"             │
│ }                                           │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Create Subscription Record       │
│ - user_id                        │
│ - service_id                     │
│ - telegram_user_id ✓             │
│ - status = "ACTIVE"              │
└──────┬───────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────┐
│ Fetch Service.telegram_group_id            │
│ (Already created by trader)                │
└──────┬─────────────────────────────────────┘
       │
       ├─ IF group_id exists:
       │    ▼
       │  ┌──────────────────────────────────┐
       │  │ telegram_group_manager.          │
       │  │ generate_invite_link()           │
       │  │                                  │
       │  │ Returns:                         │
       │  │ https://t.me/+AbCdEf...         │
       │  └────┬─────────────────────────────┘
       │       │
       │       ▼
       │  ┌──────────────────────────────────┐
       │  │ Send invite link to user         │
       │  │ (via email or response)          │
       │  └──────────────────────────────────┘
       │
       └─ IF group_id is NULL:
          (Silently fail, user can join later)
```

### Alert Flow
```
┌─────────────────┐
│   Trader        │
└────────┬────────┘
         │ 1. Send Alert
         ▼
┌──────────────────────────────────────┐
│ POST /alerts                         │
│ Body: {                              │
│   service_id: 1,                     │
│   message: "BUY RELIANCE",           │
│   stock_symbol: "RELIANCE",          │
│   action: "BUY"                      │
│ }                                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Create TradeAlert Record         │
│ - service_id = 1                 │
│ - trader_id = trader.id          │
│ - message, stock_symbol, etc.    │
└────────┬─────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│ Fetch Service.telegram_group_id            │
│ (The group for service 1)                  │
└────────┬─────────────────────────────────────┘
         │
         ├─ IF group_id exists:
         │    ▼
         │  ┌──────────────────────────────────┐
         │  │ telegram_group_manager.          │
         │  │ send_alert_to_service_group()    │
         │  │                                  │
         │  │ Format message with:             │
         │  │ - Title                          │
         │  │ - Symbol, Action, Target, SL     │
         │  │ - HTML formatting                │
         │  └────┬──────────────────────────────┘
         │       │
         │       ▼
         │  ┌──────────────────────────────────┐
         │  │ POST to Telegram API             │
         │  │ sendMessage(group_id, message)   │
         │  └────┬──────────────────────────────┘
         │       │
         │       ▼
         │  ┌──────────────────────────────────┐
         │  │ Message arrives in group         │
         │  │ ALL subscribers see it instantly │
         │  └──────────────────────────────────┘
         │
         └─ IF group_id is NULL:
            (Alert saved but not posted)
```

### Expiry Flow
```
┌────────────────────────────────────┐
│ APScheduler (every 30 mins)        │
│ Runs: check_and_expire_subscriptions│
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ Query Subscriptions WHERE:             │
│ - status = "ACTIVE"                    │
│ - end_date <= NOW()                    │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ For Each Expired Subscription:         │
└────────┬───────────────────────────────┘
         │
         ├─ 1. Update Status
         │    ▼
         │  subscription.status = "EXPIRED"
         │
         ├─ 2. Remove from Telegram Group
         │    │
         │    ├─ IF telegram_user_id exists:
         │    │    ▼
         │    │  ┌──────────────────────────┐
         │    │  │ telegram_group_manager.  │
         │    │  │ remove_user_from_        │
         │    │  │ service_group()          │
         │    │  │                          │
         │    │  │ Ban user (blocks them)   │
         │    │  │ Then unban (allows rejoin│
         │    │  │ if they resubscribe)     │
         │    │  └────┬─────────────────────┘
         │    │       │
         │    │       ▼
         │    │   User no longer in group
         │    │   (Can't see new messages)
         │    │
         │    └─ ELSE: Skip removal
         │
         └─ 3. Log the expiry
            (For audit trail)

Result: User removed from group, data marked expired
```

---

## SQL Schema

### Services Table (NEW COLUMNS)
```sql
CREATE TABLE services (
    id INTEGER PRIMARY KEY,
    trader_id INTEGER NOT NULL FOREIGN KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    telegram_group_id VARCHAR(50),           -- NEW
    telegram_group_link VARCHAR(500),        -- NEW
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Migration if table exists
ALTER TABLE services ADD COLUMN telegram_group_id VARCHAR(50);
ALTER TABLE services ADD COLUMN telegram_group_link VARCHAR(500);
```

### Subscriptions Table (NO CHANGES)
```sql
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL FOREIGN KEY,
    service_id INTEGER NOT NULL FOREIGN KEY,
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    telegram_user_id VARCHAR(50),            -- ALREADY EXISTS
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Example Data

### Services Table
```
id | trader_id | name              | telegram_group_id    | telegram_group_link
---|-----------|------------------|----------------------|------------------------------------
1  | 5         | Equity Intraday   | -1001234567890      | https://t.me/+AbCdEfG1234567890
2  | 5         | F&O Swing         | NULL                | NULL (not set up yet)
3  | 6         | Crypto Trading    | -1001234567891      | https://t.me/+XyzAbcDef1234567
```

### Subscriptions Table
```
id | user_id | service_id | telegram_user_id | status   | end_date
---|---------|-----------|------------------|----------|------------------
1  | 10      | 1         | 123456789        | ACTIVE   | 2025-01-20
2  | 11      | 1         | 987654321        | ACTIVE   | 2025-01-25
3  | 12      | 3         | 555555555        | EXPIRED  | 2025-12-01
4  | 13      | 1         | 444444444        | CANCELLED| 2025-12-15
```

### Trade Alerts Table
```
id | service_id | trader_id | message                    | sent_at
---|-----------|-----------|---------------------------|--------------------
1  | 1         | 5         | Strong BUY on RELIANCE    | 2025-12-21 14:30:00
2  | 1         | 5         | SELL INFY at 6500         | 2025-12-21 09:15:00
3  | 3         | 6         | Bitcoin breakout detected | 2025-12-21 18:45:00
```

---

## Relationships

### One-to-Many Relationships
```
Service ──┬──> Subscriptions (one service has many subscriptions)
          └──> TradeAlerts (one service has many alerts)

Trader ──┬──> Services (one trader has many services)
         └──> TradeAlerts (one trader sends many alerts)

User ────┬──> Subscriptions (one user has many subscriptions)
         └──> Trader (optional, one user is at most one trader)
```

### Telegram Data Mappings
```
telegram_group_id: String
├─ Example: "-1001234567890"
├─ Negative number = private group
├─ Unique identifier for each group
├─ Stored in: Service.telegram_group_id
└─ Used to: Send messages, manage members

telegram_user_id: String
├─ Example: "123456789"
├─ Positive number
├─ Unique identifier for each Telegram user
├─ Stored in: Subscription.telegram_user_id
└─ Used to: Add/remove user from group

telegram_group_link: String
├─ Example: "https://t.me/+AbCdEfG1234"
├─ Shareable invite URL
├─ Can be permanent (reusable) or single-use
├─ Stored in: Service.telegram_group_link
└─ Used to: Send to users, marketing
```

---

## Indexes for Performance

Recommended indexes:
```sql
-- For subscription lookup by status
CREATE INDEX idx_subscription_status 
ON subscriptions(status);

-- For finding active subscriptions
CREATE INDEX idx_subscription_active 
ON subscriptions(service_id, status, end_date);

-- For finding active alerts
CREATE INDEX idx_alerts_service 
ON trade_alerts(service_id, sent_at);

-- For finding users without telegram groups
CREATE INDEX idx_services_telegram 
ON services(telegram_group_id);
```

---

## Constraints & Validation

### Service
- `telegram_group_id`: Max 50 chars, NULL allowed
- `telegram_group_link`: Max 500 chars, NULL allowed
- Must be unique per trader (one group per service, not trader)

### Subscription
- `telegram_user_id`: Max 50 chars, numeric
- Must be provided to use Telegram features
- Can be NULL (user manually joins if interested)

### Data Integrity
```sql
-- Foreign keys enforced
ALTER TABLE services ADD CONSTRAINT fk_trader
FOREIGN KEY (trader_id) REFERENCES traders(id);

ALTER TABLE subscriptions ADD CONSTRAINT fk_service
FOREIGN KEY (service_id) REFERENCES services(id);
```

---

## Backup & Recovery

### Critical Data
```sql
-- Backup service-telegram mappings
SELECT id, name, telegram_group_id, telegram_group_link 
FROM services 
WHERE telegram_group_id IS NOT NULL;

-- Backup subscription history for recovery
SELECT id, service_id, user_id, telegram_user_id, status, end_date
FROM subscriptions
ORDER BY updated_at DESC;
```

### Recovery Procedure
If telegram_group_id is lost:
1. Group still exists in Telegram
2. Get group ID via Telegram client (copy from link)
3. Update database: `UPDATE services SET telegram_group_id = '-1001234567890' WHERE id = 1`
4. Regenerate link: `POST /traders/services/1/telegram-group/generate-link`

---

**Last Updated**: December 21, 2025  
**Schema Version**: 1.1
