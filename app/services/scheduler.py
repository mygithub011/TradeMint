import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.expiry_service import expiry_service
from app.utils.config import settings

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def start_scheduler():
    """Start the background scheduler for periodic tasks."""
    try:
        # Schedule subscription expiry check
        scheduler.add_job(
            func=expiry_service.check_and_expire_subscriptions,
            trigger="interval",
            minutes=settings.EXPIRY_CHECK_INTERVAL_MINUTES,
            id="subscription_expiry_check",
            name="Check and expire subscriptions",
            replace_existing=True
        )
        
        scheduler.start()
        logger.info(f"Scheduler started. Expiry check will run every {settings.EXPIRY_CHECK_INTERVAL_MINUTES} minutes")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")

def shutdown_scheduler():
    """Shutdown the scheduler gracefully."""
    try:
        scheduler.shutdown()
        logger.info("Scheduler shutdown successfully")
    except Exception as e:
        logger.error(f"Error shutting down scheduler: {e}")
