
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
import asyncio
from app.models.models import Subscription, Service, Trader, User
from app.utils.dependencies import get_current_user, get_db
from app.utils.schemas import SubscriptionCreate, SubscriptionResponse
from app.services.telegram_service import telegram_service

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.post("/", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Purchase a subscription to a trading service."""
    # Verify service exists and is active
    service = db.query(Service).filter(Service.id == subscription_data.service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    if not service.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service is not currently active"
        )
    
    # Verify trader is approved
    trader = db.query(Trader).filter(Trader.id == service.trader_id).first()
    if not trader or not trader.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service provider is not approved"
        )
    
    # Check if user already has an active subscription for this service
    existing_subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.service_id == subscription_data.service_id,
        Subscription.status == "ACTIVE"
    ).first()
    
    if existing_subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active subscription for this service"
        )
    
    # Calculate end date
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=service.duration_days)
    
    # Create subscription
    new_subscription = Subscription(
        user_id=current_user.id,
        service_id=service.id,
        start_date=start_date,
        end_date=end_date,
        status="ACTIVE",
        telegram_user_id=subscription_data.telegram_user_id
    )
    
    db.add(new_subscription)
    db.commit()
    db.refresh(new_subscription)
    
    # Add user to Telegram group if configured
    if subscription_data.telegram_user_id and service.telegram_group_id:
        try:
            await telegram_service.add_user_to_group(
                group_id=service.telegram_group_id,
                user_id=subscription_data.telegram_user_id
            )
        except Exception as e:
            # Log error but don't fail the subscription
            print(f"Failed to add user to Telegram group: {e}")
    
    return new_subscription

@router.get("/", response_model=List[SubscriptionResponse])
def get_my_subscriptions(
    status_filter: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all subscriptions for the current user."""
    query = db.query(Subscription).filter(Subscription.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(Subscription.status == status_filter.upper())
    
    subscriptions = query.order_by(Subscription.created_at.desc()).all()
    return subscriptions

@router.get("/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific subscription."""
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    return subscription

@router.post("/{subscription_id}/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    subscription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an active subscription."""
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found"
        )
    
    if subscription.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active subscriptions can be cancelled"
        )
    
    # Update subscription status
    subscription.status = "CANCELLED"
    subscription.updated_at = datetime.utcnow()
    
    # Remove user from Telegram group if configured
    if subscription.telegram_user_id and subscription.service.telegram_group_id:
        try:
            await telegram_service.remove_user_from_group(
                group_id=subscription.service.telegram_group_id,
                user_id=subscription.telegram_user_id
            )
        except Exception as e:
            print(f"Failed to remove user from Telegram group: {e}")
    
    db.commit()
    db.refresh(subscription)
    
    return subscription

@router.get("/service/{service_id}/subscribers")
def get_service_subscribers(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active subscribers for a service (trader only)."""
    # Verify user is the trader who owns this service
    trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only traders can view subscribers"
        )
    
    service = db.query(Service).filter(
        Service.id == service_id,
        Service.trader_id == trader.id
    ).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found or you don't have access"
        )
    
    # Get active subscriptions count
    active_count = db.query(Subscription).filter(
        Subscription.service_id == service_id,
        Subscription.status == "ACTIVE"
    ).count()
    
    return {
        "service_id": service_id,
        "service_name": service.name,
        "active_subscribers": active_count
    }

