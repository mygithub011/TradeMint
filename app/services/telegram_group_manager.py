"""
Telegram Group Manager Service
Manages one group per service with automatic user addition/removal
"""

import logging
from typing import Optional, List
from telegram import Bot
from telegram.error import TelegramError
from app.utils.config import settings

logger = logging.getLogger(__name__)


class TelegramGroupManager:
    """
    Manages Telegram groups at the service level.
    
    Features:
    - Create one group per service
    - Manage invite links with single-use or limited-use
    - Add/remove users automatically on subscription purchase/expiry
    - Send alerts to the entire group
    """
    
    def __init__(self):
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.bot = None
        if self.bot_token:
            try:
                self.bot = Bot(token=self.bot_token)
                logger.info("Telegram bot initialized for group management")
            except Exception as e:
                logger.error(f"Failed to initialize Telegram bot: {e}")
    
    async def create_service_group(self, service_name: str, trader_name: str, description: str = None) -> Optional[str]:
        """
        Create a Telegram group for a service.
        
        Args:
            service_name: Name of the service (e.g., "Equity Intraday")
            trader_name: Name of the trader providing the service
            description: Optional description of the service
            
        Returns:
            Group ID (chat_id) if successful, None otherwise
        """
        if not self.bot:
            logger.warning("Telegram bot not configured")
            return None
        
        try:
            # Create private group with service and trader name
            group_title = f"🔔 {service_name} - {trader_name}"
            
            # Create the group
            chat = await self.bot.create_supergroup(
                name=group_title,
                description=description or f"Trading alerts and updates for {service_name}"
            )
            
            group_id = str(chat.id)
            logger.info(f"Created Telegram group for {service_name}: {group_id}")
            
            # Set group to private and restrict posting
            try:
                await self.bot.set_chat_permissions(
                    chat_id=group_id,
                    permissions={
                        'can_send_messages': False,  # Only admin can send messages
                        'can_send_media_messages': False,
                        'can_send_other_messages': False,
                        'can_add_web_page_previews': False,
                    }
                )
                logger.info(f"Set message permissions for group {group_id}")
            except Exception as e:
                logger.warning(f"Could not set group permissions: {e}")
            
            return group_id
            
        except TelegramError as e:
            logger.error(f"Failed to create Telegram group: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error creating group: {e}")
            return None
    
    async def generate_invite_link(self, group_id: str, is_permanent: bool = False) -> Optional[str]:
        """
        Generate an invite link for the service group.
        
        Args:
            group_id: The group's chat ID
            is_permanent: If False, creates single-use link; if True, creates permanent link
            
        Returns:
            Invite link URL if successful, None otherwise
        """
        if not self.bot:
            logger.warning("Telegram bot not configured")
            return None
        
        try:
            if is_permanent:
                # Get existing permanent invite link
                invite_link = await self.bot.get_chat(chat_id=group_id)
                if hasattr(invite_link, 'invite_link') and invite_link.invite_link:
                    logger.info(f"Retrieved permanent invite link for group {group_id}")
                    return invite_link.invite_link
                else:
                    # Create a new permanent link
                    link = await self.bot.create_chat_invite_link(chat_id=group_id)
                    logger.info(f"Created permanent invite link for group {group_id}")
                    return link.invite_link
            else:
                # Create single-use or limited-use invite link
                link = await self.bot.create_chat_invite_link(
                    chat_id=group_id,
                    member_limit=1,
                    expire_date=None
                )
                logger.info(f"Created single-use invite link for group {group_id}")
                return link.invite_link
                
        except TelegramError as e:
            logger.error(f"Failed to generate invite link for group {group_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error generating invite link: {e}")
            return None
    
    async def add_user_to_service_group(self, group_id: str, user_id: str) -> bool:
        """
        Add a user to the service group.
        
        Args:
            group_id: The group's chat ID
            user_id: The user's Telegram ID
            
        Returns:
            True if successful, False otherwise
        """
        if not self.bot:
            logger.warning("Telegram bot not configured")
            return False
        
        try:
            # Check if user is already a member
            try:
                chat_member = await self.bot.get_chat_member(chat_id=group_id, user_id=int(user_id))
                if chat_member.status in ['member', 'administrator', 'creator']:
                    logger.info(f"User {user_id} is already a member of group {group_id}")
                    return True
            except TelegramError:
                # User is not a member, proceed with adding
                pass
            
            # Generate invite link and the user must use it
            # Note: We cannot directly add users; they must join via invite link
            invite_link = await self.generate_invite_link(group_id, is_permanent=False)
            
            if invite_link:
                logger.info(f"Generated invite link for user {user_id} to group {group_id}")
                # In production, send this link to user via email/SMS or return it
                return True
            else:
                logger.error(f"Failed to generate invite link for user {user_id}")
                return False
                
        except TelegramError as e:
            logger.error(f"Failed to add user {user_id} to group {group_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error adding user to group: {e}")
            return False
    
    async def remove_user_from_service_group(self, group_id: str, user_id: str) -> bool:
        """
        Remove a user from the service group (on subscription expiry).
        
        Args:
            group_id: The group's chat ID
            user_id: The user's Telegram ID
            
        Returns:
            True if successful, False otherwise
        """
        if not self.bot:
            logger.warning("Telegram bot not configured")
            return False
        
        try:
            # Ban and then unban to remove the user
            await self.bot.ban_chat_member(chat_id=group_id, user_id=int(user_id))
            # Unban immediately so they can rejoin with a new link if they resubscribe
            await self.bot.unban_chat_member(chat_id=group_id, user_id=int(user_id))
            logger.info(f"Removed user {user_id} from group {group_id}")
            return True
            
        except TelegramError as e:
            logger.error(f"Failed to remove user {user_id} from group {group_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error removing user from group: {e}")
            return False
    
    async def send_alert_to_service_group(self, group_id: str, message: str, parse_mode: str = 'HTML') -> bool:
        """
        Send a trade alert to the service group.
        All active subscribers to the service will receive this message.
        
        Args:
            group_id: The group's chat ID
            message: The alert message (supports HTML formatting)
            parse_mode: Message parse mode ('HTML' or 'Markdown')
            
        Returns:
            True if successful, False otherwise
        """
        if not self.bot:
            logger.warning("Telegram bot not configured")
            return False
        
        try:
            await self.bot.send_message(
                chat_id=group_id,
                text=message,
                parse_mode=parse_mode
            )
            logger.info(f"Sent alert to group {group_id}")
            return True
            
        except TelegramError as e:
            logger.error(f"Failed to send message to group {group_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending message: {e}")
            return False
    
    async def verify_bot_admin_in_group(self, group_id: str) -> bool:
        """
        Verify if bot is admin in the group.
        
        Args:
            group_id: The group's chat ID
            
        Returns:
            True if bot is admin, False otherwise
        """
        if not self.bot:
            return False
        
        try:
            me = await self.bot.get_me()
            bot_member = await self.bot.get_chat_member(chat_id=group_id, user_id=me.id)
            is_admin = bot_member.status in ['administrator', 'creator']
            logger.info(f"Bot admin status in group {group_id}: {is_admin}")
            return is_admin
        except TelegramError as e:
            logger.error(f"Failed to check bot admin status in group {group_id}: {e}")
            return False
    
    async def get_group_info(self, group_id: str) -> Optional[dict]:
        """
        Get information about a service group.
        
        Args:
            group_id: The group's chat ID
            
        Returns:
            Dictionary with group info or None if failed
        """
        if not self.bot:
            logger.warning("Telegram bot not configured")
            return None
        
        try:
            chat = await self.bot.get_chat(chat_id=group_id)
            return {
                'title': chat.title,
                'description': chat.description,
                'members_count': chat.get_member_count() if hasattr(chat, 'get_member_count') else None,
                'invite_link': chat.invite_link if hasattr(chat, 'invite_link') else None,
            }
        except TelegramError as e:
            logger.error(f"Failed to get group info for {group_id}: {e}")
            return None


# Singleton instance
telegram_group_manager = TelegramGroupManager()
