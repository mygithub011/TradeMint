import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import Subscription
from app.services.telegram_service import telegram_service
import asyncio

logger = logging.getLogger(__name__)

class SubscriptionExpiryService:
    """Service to check and handle expired subscriptions."""
    
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
                    
                    # Remove user from Telegram group if configured
                    if subscription.telegram_user_id and subscription.service.telegram_group_id:
                        asyncio.run(telegram_service.remove_user_from_group(
                            group_id=subscription.service.telegram_group_id,
                            user_id=subscription.telegram_user_id
                        ))
                    
                    logger.info(f"Expired subscription ID: {subscription.id} for user {subscription.user_id}")
                    
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
