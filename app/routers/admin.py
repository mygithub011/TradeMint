from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.models.models import Trader, User, Service, Subscription, TradeAlert
from app.utils.dependencies import get_current_admin, get_db
from app.utils.schemas import TraderResponse, ServiceResponse, SubscriptionResponse
from app.services.expiry_service import expiry_service
import asyncio

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/traders/{trader_id}/approve", response_model=TraderResponse)
def approve_trader(
    trader_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve a trader (admin only)."""
    trader = db.query(Trader).filter(Trader.id == trader_id).first()
    
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trader not found"
        )
    
    if trader.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trader is already approved"
        )
    
    # Approve trader
    trader.approved = True
    trader.approved_at = datetime.utcnow()
    trader.approved_by = current_user.id
    
    db.commit()
    db.refresh(trader)
    
    return trader

@router.post("/traders/{trader_id}/revoke")
def revoke_trader_approval(
    trader_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Revoke trader approval (admin only)."""
    trader = db.query(Trader).filter(Trader.id == trader_id).first()
    
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trader not found"
        )
    
    if not trader.approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trader is not approved"
        )
    
    # Revoke approval
    trader.approved = False
    trader.approved_at = None
    trader.approved_by = None
    
    # Deactivate all services by this trader
    db.query(Service).filter(Service.trader_id == trader_id).update({"is_active": False})
    
    db.commit()
    
    return {"message": f"Trader {trader_id} approval revoked and services deactivated"}

@router.get("/traders/pending", response_model=List[TraderResponse])
def get_pending_traders(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all traders pending approval (admin only)."""
    traders = db.query(Trader).filter(
        Trader.approved == False
    ).offset(skip).limit(limit).all()
    
    return traders

@router.get("/traders", response_model=List[TraderResponse])
def get_all_traders_admin(
    skip: int = 0,
    limit: int = 100,
    approved: bool = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all traders with filters (admin only)."""
    query = db.query(Trader)
    
    if approved is not None:
        query = query.filter(Trader.approved == approved)
    
    traders = query.offset(skip).limit(limit).all()
    return traders

@router.get("/services", response_model=List[ServiceResponse])
def get_all_services_admin(
    skip: int = 0,
    limit: int = 100,
    is_active: bool = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all services (admin only)."""
    query = db.query(Service)
    
    if is_active is not None:
        query = query.filter(Service.is_active == is_active)
    
    services = query.offset(skip).limit(limit).all()
    return services

@router.post("/services/{service_id}/deactivate")
def deactivate_service(
    service_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Deactivate a service (admin only)."""
    service = db.query(Service).filter(Service.id == service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    service.is_active = False
    db.commit()
    
    return {"message": f"Service {service_id} deactivated"}

@router.get("/subscriptions", response_model=List[SubscriptionResponse])
def get_all_subscriptions_admin(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all subscriptions (admin only)."""
    query = db.query(Subscription)
    
    if status_filter:
        query = query.filter(Subscription.status == status_filter.upper())
    
    subscriptions = query.offset(skip).limit(limit).all()
    return subscriptions

@router.post("/subscriptions/check-expiry")
def trigger_expiry_check(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Manually trigger subscription expiry check (admin only)."""
    try:
        expiry_service.check_and_expire_subscriptions()
        return {"message": "Expiry check completed successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during expiry check: {str(e)}"
        )

@router.get("/stats")
def get_system_stats(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get system statistics (admin only)."""
    total_users = db.query(User).count()
    total_traders = db.query(Trader).count()
    approved_traders = db.query(Trader).filter(Trader.approved == True).count()
    pending_traders = db.query(Trader).filter(Trader.approved == False).count()
    
    total_services = db.query(Service).count()
    active_services = db.query(Service).filter(Service.is_active == True).count()
    
    total_subscriptions = db.query(Subscription).count()
    active_subscriptions = db.query(Subscription).filter(Subscription.status == "ACTIVE").count()
    expired_subscriptions = db.query(Subscription).filter(Subscription.status == "EXPIRED").count()
    
    return {
        "users": {
            "total": total_users,
            "admins": db.query(User).filter(User.role == "admin").count(),
            "traders": db.query(User).filter(User.role == "trader").count(),
            "clients": db.query(User).filter(User.role == "client").count()
        },
        "traders": {
            "total": total_traders,
            "approved": approved_traders,
            "pending": pending_traders
        },
        "services": {
            "total": total_services,
            "active": active_services,
            "inactive": total_services - active_services
        },
        "subscriptions": {
            "total": total_subscriptions,
            "active": active_subscriptions,
            "expired": expired_subscriptions,
            "cancelled": db.query(Subscription).filter(Subscription.status == "CANCELLED").count()
        }
    }
