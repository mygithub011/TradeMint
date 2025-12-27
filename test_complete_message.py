"""
Quick test to verify complete message formatting
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.telegram_service import TelegramService

async def test_complete_message():
    telegram_service = TelegramService()
    
    # Complete alert with all fields
    complete_alert = {
        "action": "BUY",
        "stock_symbol": "INDHOTEL30DEC25740CE",
        "lot_size": 1000,
        "rate": 8.2,
        "target": 12.5,
        "stop_loss": 6.0,
        "cmp": 8.2,
        "validity": "29/12/2025",
        "message": "Optional description here"
    }
    
    formatted = telegram_service.format_trade_alert_message(complete_alert)
    
    print("="*60)
    print("FORMATTED MESSAGE (with all fields):")
    print("="*60)
    print(formatted.replace("<b>", "").replace("</b>", "").replace("<i>", "").replace("</i>", ""))
    print("="*60)
    
    # Send to Telegram
    group_id = "-1003348280516"
    success = await telegram_service.send_trade_alert(group_id, formatted)
    
    if success:
        print("\n✅ Complete message sent successfully!")
    else:
        print("\n❌ Failed to send message")

if __name__ == "__main__":
    asyncio.run(test_complete_message())
