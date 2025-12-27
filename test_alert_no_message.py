"""
Test the updated alert creation without message field
"""
import asyncio
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.telegram_service import TelegramService

async def test_alert_without_message():
    telegram_service = TelegramService()
    
    # Alert without message field
    alert_data = {
        "action": "BUY",
        "stock_symbol": "INDHOTEL30DEC25740CE",
        "lot_size": 1000,
        "rate": 8.2,
        "target": 12.5,
        "stop_loss": 6.0,
        "cmp": 8.2,
        "validity": "29/12/2025"
    }
    
    formatted = telegram_service.format_trade_alert_message(alert_data)
    
    print("="*60)
    print("FORMATTED MESSAGE (without message field):")
    print("="*60)
    print(formatted.replace("<b>", "").replace("</b>", "").replace("<i>", "").replace("</i>", ""))
    print("="*60)
    
    # Send to Telegram
    group_id = "-1003348280516"
    success = await telegram_service.send_trade_alert(group_id, formatted)
    
    if success:
        print("\n✅ Alert sent successfully without message field!")
        print("   Check your Telegram group to verify")
    else:
        print("\n❌ Failed to send alert")
    
    # Also test the API payload format
    print("\n" + "="*60)
    print("API PAYLOAD FORMAT (what frontend should send):")
    print("="*60)
    print(json.dumps({
        "service_id": 1,
        "stock_symbol": "INDHOTEL30DEC25740CE",
        "action": "BUY",
        "lot_size": 1000,
        "rate": 8.2,
        "target": 12.5,
        "stop_loss": 6.0,
        "cmp": 8.2,
        "validity": "29/12/2025"
    }, indent=2))
    print("="*60)

if __name__ == "__main__":
    asyncio.run(test_alert_without_message())
