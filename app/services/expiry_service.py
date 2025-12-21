import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import Subscription
from app.services.telegram_group_manager import telegram_group_manager
import asyncio

logger = logging.getLogger(__name__)

class SubscriptionExpiryService:
    """
    Service to check and handle expired subscriptions.
    
    On expiry:
    - Mark subscription as EXPIRED
    - Remove user from service's Telegram group
    """
    
    def check_and_expire_subscriptions(self):
        """Check for expired subscriptions and update their status."""
        db = SessionLocal()
        try:
            # Find active subscriptions that have expired
            expired_subscriptions = db.query(Subscription).filter(
                Subscription.status == "ACTIVE",
                Subscription.end_date <= datetime.utcnow()
            ).all()
            
            logger.info(f"Found {len(expired_subscriptions)} expired subscriptions")
            
            for subscription in expired_subscriptions:
                try:
                    # Update subscription status
                    subscription.status = "EXPIRED"
                    subscription.updated_at = datetime.utcnow()
                    
                    logger.info(f"Expired subscription ID: {subscription.id} for user {subscription.user_id} - Service: {subscription.service.name}")
                    
                    # Remove user from service's Telegram group
                    if subscription.telegram_user_id and subscription.service.telegram_group_id:
                        try:
                            success = asyncio.run(telegram_group_manager.remove_user_from_service_group(
                                group_id=subscription.service.telegram_group_id,
                                user_id=subscription.telegram_user_id
                            ))
                            
                            if success:
                                logger.info(f"Removed user {subscription.telegram_user_id} from service group {subscription.service.name}")
                            else:
                                logger.warning(f"Failed to remove user {subscription.telegram_user_id} from group")
                        except Exception as e:
                            logger.error(f"Error removing user from Telegram group: {e}")
                    
                except Exception as e:
                    logger.error(f"Error expiring subscription {subscription.id}: {e}")
                    continue
            
            db.commit()
            logger.info(f"Successfully processed {len(expired_subscriptions)} expired subscriptions")
            
        except Exception as e:
            logger.error(f"Error in expiry check: {e}")
            db.rollback()
        finally:
            db.close()

# Singleton instance
expiry_service = SubscriptionExpiryService()
