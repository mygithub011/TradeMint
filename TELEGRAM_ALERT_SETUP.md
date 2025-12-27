# Telegram Alert Feature Setup Guide

## Overview
The Send Alert feature allows traders to send trade recommendations to their Telegram group. When an alert is sent, a formatted message is automatically posted to the configured Telegram group.

## Message Format
```
📈 New Trade Recommendation
BUY: INDHOTEL30DEC25740CE

Lotsize: 1000
Rate: 8.2
Target: 12.5
Stop Loss: 6
CMP: 8.2
Validity: 29/12/2025
```

## Setup Steps

### 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts to:
   - Choose a name for your bot (e.g., "TradeMint Bot")
   - Choose a username (e.g., "TradeMintBot")
4. You'll receive a bot token like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
5. **Save this token securely!**

### 2. Add Bot to Your Telegram Group

1. Open your Telegram group (https://web.telegram.org/a/#-5043681958)
2. Click on the group name/info
3. Click "Add Members"
4. Search for your bot username (e.g., @TradeMintBot)
5. Add the bot to the group
6. Make the bot an **Admin** with at least these permissions:
   - Send messages
   - Delete messages (optional)

### 3. Get Your Group ID

Your group ID is: `-5043681958`

To verify or get a group ID:
1. Add the bot to the group
2. Send a message in the group
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for `"chat":{"id":-5043681958,...}` in the response

### 4. Configure the Application

1. **Add Bot Token to .env file:**
   ```bash
   # Edit .env file
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

2. **Update Database (if needed):**
   ```bash
   python update_schema.py
   ```

3. **Reseed Database with Telegram Group ID:**
   ```bash
   python seed_local.py
   ```
   
   This will update all services with the Telegram group ID `-5043681958`

### 5. Test the Integration

1. **Start the backend server:**
   ```bash
   uvicorn app.main:app --reload
   ```

2. **Log in as a trader:**
   - Email: `trader@example.com`
   - Password: `trader123`

3. **Send a test alert:**
   
   Go to the trader dashboard and fill in the alert form:
   - **Service**: Select one of your services
   - **Stock Symbol**: `INDHOTEL30DEC25740CE`
   - **Action**: `BUY`
   - **Lot Size**: `1000`
   - **Rate**: `8.2`
   - **Target**: `12.5`
   - **Stop Loss**: `6`
   - **CMP**: `8.2`
   - **Validity**: `29/12/2025`
   - **Message** (optional): Any additional notes

4. **Check Telegram Group:**
   - The message should appear in your Telegram group
   - It will be formatted according to the template

## API Endpoint

### Send Alert
**POST** `/alerts/`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "service_id": 1,
  "stock_symbol": "INDHOTEL30DEC25740CE",
  "action": "BUY",
  "lot_size": 1000,
  "rate": 8.2,
  "target": 12.5,
  "stop_loss": 6.0,
  "cmp": 8.2,
  "validity": "29/12/2025",
  "message": "Optional custom message"
}
```

**Response:**
```json
{
  "id": 1,
  "service_id": 1,
  "trader_id": 1,
  "message": "Optional custom message",
  "sent_at": "2025-12-25T10:30:00",
  "stock_symbol": "INDHOTEL30DEC25740CE",
  "action": "BUY",
  "lot_size": 1000,
  "rate": "8.2",
  "target": "12.5",
  "stop_loss": "6.0",
  "cmp": "8.2",
  "validity": "29/12/2025"
}
```

## Troubleshooting

### Bot Not Sending Messages

1. **Check Bot Token:**
   - Ensure the token in `.env` is correct
   - Token should not have any extra spaces

2. **Check Bot Permissions:**
   - Bot must be an admin in the group
   - Bot must have "Send Messages" permission

3. **Check Group ID:**
   - Group ID should start with `-` (negative number)
   - Format: `-5043681958`

4. **Check Logs:**
   ```bash
   # Look for error messages in the console
   # Common errors:
   # - "Telegram bot not configured" → Missing bot token
   # - "Forbidden: bot is not a member" → Bot not added to group
   # - "Forbidden: bot was kicked" → Bot was removed from group
   ```

### Service Not Configured

If you see "No Telegram group configured for service":
1. Check the service has `telegram_group_id` set
2. Update the service:
   ```bash
   python seed_local.py  # This will set the group ID
   ```
   
Or manually update via API:
```bash
PATCH /services/{service_id}
{
  "telegram_group_id": "-5043681958"
}
```

### Database Schema Issues

If you get column errors:
```bash
python update_schema.py
```

This will add the new columns to the existing database.

## Testing Checklist

- [ ] Bot token added to `.env`
- [ ] Bot added to Telegram group
- [ ] Bot has admin permissions
- [ ] Database schema updated
- [ ] Services have `telegram_group_id` set
- [ ] Backend server running
- [ ] Logged in as trader
- [ ] Test alert sent successfully
- [ ] Message appears in Telegram group
- [ ] Message is properly formatted

## Next Steps

1. **Multiple Groups**: If you want different services to use different groups, update each service's `telegram_group_id` separately
2. **Custom Templates**: Modify the `format_trade_alert_message` method in `app/services/telegram_service.py`
3. **Rich Formatting**: Add more emoji, bold text, or formatting options
4. **Attachments**: Extend the feature to support images or charts

## Security Notes

- **Never commit** `.env` file with real bot tokens
- Keep your bot token **private**
- Use environment variables in production
- Regularly rotate bot tokens if compromised
- Monitor bot usage in BotFather

## Support

For issues:
1. Check the logs in the console
2. Verify bot permissions in Telegram
3. Test bot token using: `https://api.telegram.org/bot<TOKEN>/getMe`
4. Check the API documentation at: http://127.0.0.1:8000/docs
