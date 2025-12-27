"""
Test script to send a sample trade alert
This will help you verify the Telegram integration is working
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.telegram_service import TelegramService
from app.utils.config import settings

async def test_telegram_alert():
    """Test sending a trade alert to Telegram."""
    
    print("="*60)
    print("TELEGRAM ALERT TEST")
    print("="*60)
    
    # Check if bot token is configured
    if not settings.TELEGRAM_BOT_TOKEN:
        print("\n❌ ERROR: Telegram bot token not configured!")
        print("   Please add TELEGRAM_BOT_TOKEN to your .env file")
        print("\n   Steps:")
        print("   1. Open .env file")
        print("   2. Add: TELEGRAM_BOT_TOKEN=your_bot_token_here")
        print("   3. Get token from @BotFather on Telegram")
        return
    
    print(f"\n✓ Bot token configured: {settings.TELEGRAM_BOT_TOKEN[:10]}...{settings.TELEGRAM_BOT_TOKEN[-5:]}")
    
    # Initialize Telegram service
    telegram_service = TelegramService()
    
    if not telegram_service.bot:
        print("\n❌ ERROR: Failed to initialize Telegram bot")
        print("   Check if your bot token is valid")
        return
    
    print("✓ Telegram bot initialized successfully")
    
    # Test group ID (migrated supergroup)
    group_id = "-1003348280516"  # New supergroup ID (migrated from -5043681958)
    print(f"\n📱 Target group ID: {group_id}")
    
    # Sample alert data
    sample_alert = {
        "action": "BUY",
        "stock_symbol": "INDHOTEL30DEC25740CE",
        "lot_size": 1000,
        "rate": 8.2,
        "target": 12.5,
        "stop_loss": 6.0,
        "cmp": 8.2,
        "validity": "29/12/2025",
        "message": "Test alert from TradeMint"
    }
    
    print("\n📋 Sample alert data:")
    for key, value in sample_alert.items():
        print(f"   {key}: {value}")
    
    # Format message
    formatted_message = telegram_service.format_trade_alert_message(sample_alert)
    
    print("\n📝 Formatted message:")
    print("-" * 60)
    # Print without HTML tags for display
    display_message = formatted_message.replace("<b>", "").replace("</b>", "").replace("<i>", "").replace("</i>", "")
    print(display_message)
    print("-" * 60)
    
    # Send message
    print("\n🚀 Sending alert to Telegram group...")
    
    try:
        success = await telegram_service.send_trade_alert(
            group_id=group_id,
            message=formatted_message
        )
        
        if success:
            print("\n✅ SUCCESS! Alert sent to Telegram group")
            print(f"   Check your Telegram group: https://web.telegram.org/a/#{group_id.replace('-', '')}")
        else:
            print("\n❌ FAILED to send alert")
            print("   Common issues:")
            print("   - Bot not added to the group")
            print("   - Bot doesn't have admin permissions")
            print("   - Incorrect group ID")
            print("\n   Troubleshooting:")
            print("   1. Make sure bot is added to group")
            print("   2. Make bot an admin with 'Send Messages' permission")
            print("   3. Verify group ID is correct")
    
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\n   This usually means:")
        print("   - Bot is not a member of the group")
        print("   - Bot was kicked from the group")
        print("   - Group ID is incorrect")

if __name__ == "__main__":
    print("\n⚠️  IMPORTANT: Make sure you have:")
    print("   1. Created a bot via @BotFather")
    print("   2. Added TELEGRAM_BOT_TOKEN to .env")
    print("   3. Added bot to your Telegram group")
    print("   4. Made bot an admin in the group")
    print("\nPress Enter to continue or Ctrl+C to exit...")
    try:
        input()
    except KeyboardInterrupt:
        print("\n\n❌ Test cancelled")
        sys.exit(0)
    
    # Run the test
    asyncio.run(test_telegram_alert())
    
    print("\n" + "="*60)
    print("Test completed!")
    print("="*60)
