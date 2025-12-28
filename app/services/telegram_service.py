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
    
    def format_trade_alert_message(self, alert_data: dict) -> str:
        """Format trade alert data into a Telegram message."""
        action_emoji = "📈" if alert_data.get("action") == "BUY" else "📉"
        
        message_lines = [
            f"{action_emoji} <b>New Trade Recommendation</b>",
            f"<b>{alert_data.get('action', 'N/A')}: {alert_data.get('stock_symbol', 'N/A')}</b>",
            ""
        ]
        
        # Always show these fields in order (matching the sample format)
        if alert_data.get("lot_size"):
            message_lines.append(f"Lotsize: {alert_data['lot_size']}")
        
        if alert_data.get("rate"):
            message_lines.append(f"Rate: {alert_data['rate']}")
        
        if alert_data.get("target"):
            message_lines.append(f"Target: {alert_data['target']}")
        
        if alert_data.get("stop_loss"):
            message_lines.append(f"Stop Loss: {alert_data['stop_loss']}")
        
        if alert_data.get("cmp"):
            message_lines.append(f"CMP: {alert_data['cmp']}")
        
        if alert_data.get("validity"):
            message_lines.append(f"Validity: {alert_data['validity']}")
        
        return "\n".join(message_lines)
    
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
    async def create_service_group(self, service_name: str, trader_name: str, service_id: int) -> tuple[Optional[str], Optional[str]]:
        """Create a new Telegram group for a service.
        
        Returns:
            tuple: (group_id, invite_link) or (None, None) if failed
        """
        if not self.bot:
            logger.warning("Telegram bot not configured, cannot create group")
            return None, None
        
        try:
            # Create group name with service and trader info
            group_title = f"{trader_name} - {service_name}"
            group_description = f"Exclusive trading alerts for {service_name} by {trader_name}. Service ID: {service_id}"
            
            # Create the group - Note: Bot must have permissions
            # The bot will be the creator/admin automatically
            chat = await self.bot.create_chat(title=group_title)
            group_id = str(chat.id)
            
            # Set group description
            try:
                await self.bot.set_chat_description(chat_id=group_id, description=group_description)
            except TelegramError as e:
                logger.warning(f"Could not set group description: {e}")
            
            # Generate permanent invite link
            invite_link = await self.bot.create_chat_invite_link(
                chat_id=group_id,
                creates_join_request=False  # Members can join directly
            )
            
            logger.info(f"Created Telegram group '{group_title}' with ID: {group_id}")
            return group_id, invite_link.invite_link
            
        except TelegramError as e:
            logger.error(f"Failed to create Telegram group for service {service_id}: {e}")
            return None, None
        except Exception as e:
            logger.error(f"Unexpected error creating Telegram group: {e}")
            return None, None
    
    async def get_or_create_service_group(self, service_name: str, trader_name: str, service_id: int, existing_group_id: Optional[str] = None) -> tuple[Optional[str], Optional[str]]:
        """Get existing group or create new one if doesn't exist.
        
        Args:
            service_name: Name of the service
            trader_name: Name of the trader
            service_id: ID of the service
            existing_group_id: Existing group ID to verify, if any
        
        Returns:
            tuple: (group_id, invite_link) or (None, None) if failed
        """
        if not self.bot:
            logger.warning("Telegram bot not configured")
            return None, None
        
        # If group ID exists, verify it's still valid
        if existing_group_id:
            try:
                chat = await self.bot.get_chat(chat_id=existing_group_id)
                # Generate new invite link
                invite_link = await self.bot.create_chat_invite_link(
                    chat_id=existing_group_id,
                    creates_join_request=False
                )
                logger.info(f"Using existing group {existing_group_id} for service {service_id}")
                return existing_group_id, invite_link.invite_link
            except TelegramError as e:
                logger.warning(f"Existing group {existing_group_id} not accessible, creating new one: {e}")
        
        # Create new group
        return await self.create_service_group(service_name, trader_name, service_id)
# Singleton instance
telegram_service = TelegramService()
