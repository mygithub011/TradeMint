from typing import Optional
import logging
from telegram import Bot
from telegram.error import TelegramError
from app.utils.config import settings

logger = logging.getLogger(__name__)

class TelegramService:
    def __init__(self):
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.bot = None
        if self.bot_token:
            try:
                self.bot = Bot(token=self.bot_token)
                logger.info("Telegram bot initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Telegram bot: {e}")
    
    async def add_user_to_group(self, group_id: str, user_id: str) -> bool:
        """Add a user to a Telegram group."""
        if not self.bot:
            logger.warning("Telegram bot not configured")
            return False
        
        try:
            # Note: The bot must be an admin in the group
            # and have permission to add members
            chat_member = await self.bot.get_chat_member(chat_id=group_id, user_id=int(user_id))
            
            if chat_member.status in ['member', 'administrator', 'creator']:
                logger.info(f"User {user_id} already in group {group_id}")
                return True
            
            # Generate invite link for the user
            invite_link = await self.bot.create_chat_invite_link(
                chat_id=group_id,
                member_limit=1,
                expire_date=None
            )
            
            logger.info(f"Created invite link for user {user_id} to group {group_id}")
            # In a real implementation, you would send this link to the user
            # via their registered email or a separate notification system
            return True
            
        except TelegramError as e:
            logger.error(f"Failed to add user {user_id} to group {group_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error adding user to group: {e}")
            return False
    
    async def remove_user_from_group(self, group_id: str, user_id: str) -> bool:
        """Remove a user from a Telegram group."""
        if not self.bot:
            logger.warning("Telegram bot not configured")
            return False
        
        try:
            await self.bot.ban_chat_member(chat_id=group_id, user_id=int(user_id))
            await self.bot.unban_chat_member(chat_id=group_id, user_id=int(user_id))
            logger.info(f"Removed user {user_id} from group {group_id}")
            return True
        except TelegramError as e:
            logger.error(f"Failed to remove user {user_id} from group {group_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error removing user from group: {e}")
            return False
    
    async def send_trade_alert(self, group_id: str, message: str) -> bool:
        """Send a trade alert to a Telegram group."""
        if not self.bot:
            logger.warning("Telegram bot not configured")
            return False
        
        try:
            await self.bot.send_message(chat_id=group_id, text=message, parse_mode='HTML')
            logger.info(f"Sent trade alert to group {group_id}")
            return True
        except TelegramError as e:
            logger.error(f"Failed to send message to group {group_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending message: {e}")
            return False
    
    async def verify_bot_admin(self, group_id: str) -> bool:
        """Verify if bot is admin in the group."""
        if not self.bot:
            return False
        
        try:
            bot_member = await self.bot.get_chat_member(chat_id=group_id, user_id=self.bot.id)
            is_admin = bot_member.status in ['administrator', 'creator']
            logger.info(f"Bot admin status in group {group_id}: {is_admin}")
            return is_admin
        except TelegramError as e:
            logger.error(f"Failed to check bot admin status in group {group_id}: {e}")
            return False

# Singleton instance
telegram_service = TelegramService()
