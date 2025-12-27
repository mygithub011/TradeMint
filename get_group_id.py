"""
Script to get Telegram Group ID

Steps:
1. Make sure your bot is added to the Telegram group as an administrator
2. Send any message in the group
3. Run this script to see the group ID
"""

import requests
import sys

BOT_TOKEN = "8358386533:AAG-zmUuYFUMF0Mq5LX6Vq7TzB-PLW9lpZM"

print("=" * 60)
print("Getting Telegram Group ID")
print("=" * 60)

print("\nFetching updates from Telegram Bot API...")
url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates"

try:
    response = requests.get(url)
    data = response.json()
    
    if not data.get("ok"):
        print(f"❌ Error: {data.get('description', 'Unknown error')}")
        sys.exit(1)
    
    updates = data.get("result", [])
    
    if not updates:
        print("\n⚠️  No messages found!")
        print("\nTo get the group ID:")
        print("1. Add your bot to the Telegram group")
        print("2. Make the bot an administrator")
        print("3. Send a message in the group")
        print("4. Run this script again")
        sys.exit(0)
    
    print(f"\n✅ Found {len(updates)} updates")
    print("\nGroup/Chat IDs found:")
    
    seen_chats = set()
    for update in updates:
        chat = None
        
        if "message" in update:
            chat = update["message"].get("chat")
        elif "channel_post" in update:
            chat = update["channel_post"].get("chat")
        
        if chat:
            chat_id = chat["id"]
            chat_title = chat.get("title", chat.get("first_name", "Unknown"))
            chat_type = chat["type"]
            
            if chat_id not in seen_chats:
                seen_chats.add(chat_id)
                print(f"\n  📱 {chat_title}")
                print(f"     Type: {chat_type}")
                print(f"     ID: {chat_id}")
                
                if chat_type in ["supergroup", "group"]:
                    print(f"     ✅ Use this ID for services: {chat_id}")
    
    if not seen_chats:
        print("\n⚠️  No group chats found in updates")
    
    print("\n" + "=" * 60)
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    sys.exit(1)
