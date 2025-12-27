"""
Cron endpoints for Vercel serverless functions
These endpoints are called by Vercel Cron Jobs for scheduled tasks
"""

from fastapi import APIRouter, Header, HTTPException
import logging
import os
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.models import Subscription
from app.services.telegram_group_manager import telegram_group_manager
import asyncio

router = APIRouter(prefix="/cron", tags=["cron"])
logger = logging.getLogger(__name__)

def verify_cron_secret(authorization: str = None):
    """Verify that the request is from Vercel Cron"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    # Check against secret
    expected_secret = os.getenv("CRON_SECRET")
    if not expected_secret:
        raise HTTPException(status_code=500, detail="CRON_SECRET not configured")
    
    if token != expected_secret:
        raise HTTPException(status_code=401, detail="Invalid cron secret")


@router.post("/check-expiry")
async def check_expiry_cron(authorization: str = Header(None)):
    """
    Cron job endpoint to check and expire subscriptions
    Called hourly by Vercel Cron
    
    Security: Requires CRON_SECRET in Authorization header
    """
    verify_cron_secret(authorization)
    
    logger.info("Running subscription expiry check from cron...")
    
    db = SessionLocal()
    try:
        # Find active subscriptions that have expired
        expired_subscriptions = db.query(Subscription).filter(
            Subscription.status == "ACTIVE",
            Subscription.end_date <= datetime.utcnow()
        ).all()
        
        logger.info(f"Found {len(expired_subscriptions)} expired subscriptions")
        
        expired_count = 0
        removed_from_groups = 0
        
        for subscription in expired_subscriptions:
            try:
                # Update subscription status
                subscription.status = "EXPIRED"
                subscription.updated_at = datetime.utcnow()
                expired_count += 1
                
                logger.info(f"Expired subscription ID: {subscription.id} for user {subscription.user_id}")
                
                # Remove user from service's Telegram group
                if subscription.telegram_user_id and subscription.service.telegram_group_id:
                    try:
                        success = await telegram_group_manager.remove_user_from_service_group(
                            group_id=subscription.service.telegram_group_id,
                            user_id=subscription.telegram_user_id
                        )
                        
                        if success:
                            removed_from_groups += 1
                            logger.info(f"Removed user {subscription.telegram_user_id} from service group")
                        else:
                            logger.warning(f"Failed to remove user {subscription.telegram_user_id} from group")
                    except Exception as e:
                        logger.error(f"Error removing user from Telegram group: {e}", exc_info=True)
                
            except Exception as e:
                logger.error(f"Error processing subscription {subscription.id}: {e}", exc_info=True)
                continue
        
        # Commit all changes
        db.commit()
        
        result = {
            "status": "success",
            "checked_at": datetime.utcnow().isoformat(),
            "expired_subscriptions": expired_count,
            "removed_from_telegram_groups": removed_from_groups
        }
        
        logger.info(f"Expiry check complete: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error in expiry check: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/health")
async def cron_health():
    """Health check endpoint for cron service"""
    return {
        "status": "healthy",
        "service": "cron",
        "timestamp": datetime.utcnow().isoformat()
    }
