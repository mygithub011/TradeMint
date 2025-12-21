# Smart Trade - SEBI-Compliant Trade Subscription Platform

A production-ready FastAPI backend that enables SEBI-registered traders to sell trade-idea subscriptions and clients to purchase them. **This platform does NOT execute trades** - it only distributes trade ideas through Telegram groups.

## 🌟 Features

### User Management
- **Three user roles**: Admin, Trader, Client
- JWT-based authentication
- Secure password hashing with bcrypt

### Trader Onboarding (SEBI Compliance)
- SEBI registration number validation
- Certificate upload and storage
- Admin approval workflow
- Only approved traders can create services

### Trade Services
- Multiple service types (Equity Intraday, F&O, Swing Trading, Positional)
- Flexible pricing and duration (30/90/180/365 days)
- Telegram group integration for trade alerts
- Service activation/deactivation

### Subscription Management
- Client purchase subscriptions
- Automatic subscription expiry handling
- Telegram group access management
- Subscription status tracking (ACTIVE, EXPIRED, CANCELLED)

### Telegram Integration
- Automatic user addition to private groups on subscription
- Automatic removal on expiry/cancellation
- Trade alert broadcasting
- Bot verification and admin checks

### Admin Panel
- Approve/revoke trader registrations
- Monitor all services and subscriptions
- Manual expiry checks
- System statistics dashboard

### Background Services
- APScheduler for automated subscription expiry checks
- Configurable check intervals
- Automatic Telegram group cleanup

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── db/
│   │   └── database.py         # Database configuration
│   ├── models/
│   │   └── models.py           # SQLAlchemy models
│   ├── routers/
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── traders.py         # Trader management
│   │   ├── services.py        # Service listings
│   │   ├── subscriptions.py   # Subscription management
│   │   ├── admin.py           # Admin operations
│   │   └── alerts.py          # Trade alerts
│   ├── services/
│   │   ├── telegram_service.py # Telegram bot integration
│   │   ├── expiry_service.py   # Subscription expiry logic
│   │   └── scheduler.py        # Background task scheduler
│   └── utils/
│       ├── auth.py            # JWT and password utilities
│       ├── config.py          # Application settings
│       ├── dependencies.py    # FastAPI dependencies
│       └── schemas.py         # Pydantic models
├── requirements.txt
├── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone the repository** (or navigate to the backend folder)
```powershell
cd backend
```

2. **Create a virtual environment**
```powershell
python -m venv venv
```

3. **Activate the virtual environment**
```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Windows Command Prompt
venv\Scripts\activate.bat

# Linux/Mac
source venv/bin/activate
```

4. **Install dependencies**
```powershell
pip install -r requirements.txt
```

5. **Configure environment variables**
```powershell
# Copy the example environment file
copy .env.example .env

# Edit .env and update the following:
# - SECRET_KEY (generate with: openssl rand -hex 32)
# - TELEGRAM_BOT_TOKEN (if using Telegram integration)
```

6. **Run the application**
```powershell
uvicorn app.main:app --reload
```

The API will be available at:
- **API**: http://127.0.0.1:8000
- **Swagger Documentation**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## 🧪 Testing Guide

### Using Swagger UI (Recommended)

1. Open http://127.0.0.1:8000/docs in your browser

2. **Register an Admin**
```json
POST /auth/register
{
  "email": "admin@smarttrade.com",
  "password": "admin123",
  "role": "admin"
}
```

3. **Register a Trader**
```json
POST /auth/register
{
  "email": "trader@example.com",
  "password": "trader123",
  "role": "trader"
}
```

4. **Login as Trader**
```json
POST /auth/login
{
  "username": "trader@example.com",
  "password": "trader123"
}
```
Copy the `access_token` from the response.

5. **Authorize in Swagger**
- Click the "Authorize" button at the top
- Enter: `Bearer <your_access_token>`
- Click "Authorize"

6. **Onboard Trader (with SEBI registration)**
```json
POST /traders/onboard
{
  "sebi_reg": "INH000001234"
}
```
Upload a certificate file (optional).

7. **Login as Admin and Approve Trader**
```json
POST /auth/login
{
  "username": "admin@smarttrade.com",
  "password": "admin123"
}
```

Then approve the trader:
```json
POST /admin/traders/1/approve
```

8. **Create a Service (as approved trader)**
```json
POST /traders/services
{
  "name": "Equity Intraday Calls",
  "description": "High-accuracy intraday stock recommendations",
  "price": 5000,
  "duration_days": 30,
  "telegram_group_id": "-1001234567890"
}
```

9. **Register a Client**
```json
POST /auth/register
{
  "email": "client@example.com",
  "password": "client123",
  "role": "client"
}
```

10. **Buy a Subscription (as client)**
```json
POST /subscriptions/
{
  "service_id": 1,
  "telegram_user_id": "123456789"
}
```

11. **Send Trade Alert (as trader)**
```json
POST /alerts/
{
  "service_id": 1,
  "message": "BUY Reliance at CMP. Target: 2850, Stop Loss: 2750",
  "stock_symbol": "RELIANCE",
  "action": "BUY",
  "target_price": "2850",
  "stop_loss": "2750"
}
```

12. **Check Subscription Status**
```json
GET /subscriptions/
```

13. **Verify Expiry Logic**
```json
POST /admin/subscriptions/check-expiry
```

14. **View System Stats**
```json
GET /admin/stats
```

## 📊 Database Schema

### Users
- id, email, password (hashed), role, created_at

### Traders
- id, user_id, sebi_reg, certificate_path, approved, approved_at, approved_by

### Services
- id, trader_id, name, description, price, duration_days, telegram_group_id, is_active

### Subscriptions
- id, user_id, service_id, start_date, end_date, status, telegram_user_id

### Trade Alerts
- id, service_id, trader_id, message, stock_symbol, action, target_price, stop_loss, sent_at

## 🔐 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### Traders
- `POST /traders/onboard` - Onboard as trader with SEBI certificate
- `GET /traders/me` - Get trader profile
- `POST /traders/services` - Create new service
- `GET /traders/services` - Get my services
- `GET /traders/all` - List all traders (public)

### Services
- `GET /services/` - List all active services
- `GET /services/{service_id}` - Get service details
- `GET /services/trader/{trader_id}` - Get services by trader

### Subscriptions
- `POST /subscriptions/` - Purchase subscription
- `GET /subscriptions/` - Get my subscriptions
- `GET /subscriptions/{subscription_id}` - Get subscription details
- `POST /subscriptions/{subscription_id}/cancel` - Cancel subscription
- `GET /subscriptions/service/{service_id}/subscribers` - Get subscriber count

### Trade Alerts
- `POST /alerts/` - Send trade alert (trader only)
- `GET /alerts/service/{service_id}` - Get service alerts
- `GET /alerts/my-alerts` - Get my sent alerts

### Admin
- `POST /admin/traders/{trader_id}/approve` - Approve trader
- `POST /admin/traders/{trader_id}/revoke` - Revoke approval
- `GET /admin/traders/pending` - Get pending traders
- `GET /admin/traders` - Get all traders
- `GET /admin/services` - Get all services
- `POST /admin/services/{service_id}/deactivate` - Deactivate service
- `GET /admin/subscriptions` - Get all subscriptions
- `POST /admin/subscriptions/check-expiry` - Trigger expiry check
- `GET /admin/stats` - Get system statistics

## 🤖 Telegram Bot Setup (Optional)

1. **Create a Telegram bot**:
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Follow instructions to get your bot token

2. **Add bot to your private group**:
   - Create a private Telegram group
   - Add your bot as admin with "Add Members" permission
   - Get the group ID (use @getidsbot or similar)

3. **Configure in .env**:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

4. **Test the integration**:
   - Create a service with the group ID
   - Subscribe with your Telegram user ID
   - Send a trade alert

## ⚙️ Configuration

Edit `.env` file to configure:

| Variable | Description | Default |
|----------|-------------|---------|
| SECRET_KEY | JWT secret key | (generate new) |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token validity | 1440 (24 hours) |
| DATABASE_URL | Database connection | sqlite:///./smarttrade.db |
| TELEGRAM_BOT_TOKEN | Telegram bot token | None |
| UPLOAD_DIR | Certificate storage | ./uploads/certificates |
| MAX_FILE_SIZE | Max upload size | 5242880 (5MB) |
| EXPIRY_CHECK_INTERVAL_MINUTES | Expiry check frequency | 60 minutes |

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control (RBAC)
- SEBI registration validation
- File upload size limits
- SQL injection protection (SQLAlchemy ORM)
- CORS configuration

## 📝 Production Deployment Checklist

- [ ] Generate strong SECRET_KEY
- [ ] Configure specific CORS origins
- [ ] Switch to PostgreSQL database
- [ ] Set up proper file storage (S3/Cloud Storage)
- [ ] Configure SSL/TLS certificates
- [ ] Set up proper logging and monitoring
- [ ] Configure backup strategy
- [ ] Set up rate limiting
- [ ] Review and harden security settings
- [ ] Set up proper environment variables
- [ ] Configure production WSGI server (Gunicorn)

## 🐛 Troubleshooting

### Database Issues
```powershell
# Delete and recreate database
rm smarttrade.db
# Restart the application
```

### Import Errors
```powershell
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

### Telegram Bot Not Working
- Verify bot token is correct
- Ensure bot is admin in the group
- Check group ID format (should be negative for supergroups)

## 📄 License

This project is for educational and commercial use. Ensure SEBI compliance when deploying.

## 🤝 Support

For issues and questions:
1. Check the Swagger documentation at `/docs`
2. Review this README
3. Check application logs
4. Verify database entries

## 🔄 Updates and Maintenance

- Regularly update dependencies: `pip install --upgrade -r requirements.txt`
- Monitor subscription expiry job execution
- Review system stats via `/admin/stats`
- Backup database regularly

---

**Built with FastAPI, SQLAlchemy, and Python Telegram Bot**

**Version**: 1.0.0  
**Status**: Production Ready ✅
