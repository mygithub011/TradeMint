
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from app.models.models import Trader, Service, User, TradeAlert
from app.utils.dependencies import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])

# Response schemas
class TraderMarketplaceResponse(BaseModel):
    id: int
    name: str
    sebi_reg: str
    image_url: str | None
    bio: str | None
    trades_per_day: int
    total_services: int
    total_subscribers: int
    services: List[dict]
    
    class Config:
        from_attributes = True

class ServiceMarketplaceResponse(BaseModel):
    id: int
    name: str
    description: str | None
    price: int
    duration_days: int
    is_active: bool
    trader_email: str
    trader_name: str
    trader_sebi_reg: str
    subscriber_count: int
    
    class Config:
        from_attributes = True


@router.get("/traders", response_model=List[TraderMarketplaceResponse])
def get_marketplace_traders(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all approved traders with their services for marketplace display."""
    
    # Get all approved traders
    traders = db.query(Trader).filter(Trader.approved == True).offset(skip).limit(limit).all()
    
    result = []
    for trader in traders:
        # Get user email
        user = db.query(User).filter(User.id == trader.user_id).first()
        
        # Count active services
        active_services = db.query(Service).filter(
            Service.trader_id == trader.id,
            Service.is_active == True
        ).all()
        
        # Count total subscribers across all services
        from app.models.models import Subscription
        total_subscribers = db.query(func.count(Subscription.id)).join(
            Service, Subscription.service_id == Service.id
        ).filter(
            Service.trader_id == trader.id,
            Subscription.status == "ACTIVE"
        ).scalar() or 0
        
        # Format services
        services_data = []
        for service in active_services:
            subscriber_count = db.query(func.count(Subscription.id)).filter(
                Subscription.service_id == service.id,
                Subscription.status == "ACTIVE"
            ).scalar() or 0
            
            services_data.append({
                "id": service.id,
                "name": service.name,
                "description": service.description,
                "price": service.price,
                "duration_days": service.duration_days,
                "subscriber_count": subscriber_count
            })
        
        result.append({
            "id": trader.id,
            "name": trader.name or user.email.split('@')[0],
            "sebi_reg": trader.sebi_reg,
            "image_url": trader.image_url,
            "bio": trader.bio,
            "trades_per_day": trader.trades_per_day,
            "total_services": len(active_services),
            "total_subscribers": total_subscribers,
            "services": services_data
        })
    
    return result


@router.get("/services", response_model=List[ServiceMarketplaceResponse])
def get_marketplace_services(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all active services from approved traders for marketplace display."""
    
    # Get all active services from approved traders
    services = db.query(Service).join(Trader).filter(
        Trader.approved == True,
        Service.is_active == True
    ).offset(skip).limit(limit).all()
    
    result = []
    for service in services:
        # Get trader info
        trader = db.query(Trader).filter(Trader.id == service.trader_id).first()
        user = db.query(User).filter(User.id == trader.user_id).first()
        
        # Count subscribers
        from app.models.models import Subscription
        subscriber_count = db.query(func.count(Subscription.id)).filter(
            Subscription.service_id == service.id,
            Subscription.status == "ACTIVE"
        ).scalar() or 0
        
        result.append({
            "id": service.id,
            "name": service.name,
            "description": service.description,
            "price": service.price,
            "duration_days": service.duration_days,
            "is_active": service.is_active,
            "trader_email": user.email,
            "trader_name": trader.name or user.email.split('@')[0],
            "trader_sebi_reg": trader.sebi_reg,
            "subscriber_count": subscriber_count
        })
    
    return result


@router.get("/traders/{trader_id}")
def get_trader_details(trader_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific trader."""
    
    trader = db.query(Trader).filter(
        Trader.id == trader_id,
        Trader.approved == True
    ).first()
    
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trader not found"
        )
    
    # Get user info
    user = db.query(User).filter(User.id == trader.user_id).first()
    
    # Get services
    services = db.query(Service).filter(
        Service.trader_id == trader.id,
        Service.is_active == True
    ).all()
    
    # Calculate statistics
    from app.models.models import Subscription
    total_subscribers = db.query(func.count(Subscription.id)).join(
        Service, Subscription.service_id == Service.id
    ).filter(
        Service.trader_id == trader.id,
        Subscription.status == "ACTIVE"
    ).scalar() or 0
    
    # Get recent trades count (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_trades = db.query(func.count(TradeAlert.id)).filter(
        TradeAlert.trader_id == trader.id,
        TradeAlert.sent_at >= thirty_days_ago
    ).scalar() or 0
    
    services_data = []
    for service in services:
        subscriber_count = db.query(func.count(Subscription.id)).filter(
            Subscription.service_id == service.id,
            Subscription.status == "ACTIVE"
        ).scalar() or 0
        
        services_data.append({
            "id": service.id,
            "name": service.name,
            "description": service.description,
            "price": service.price,
            "duration_days": service.duration_days,
            "subscriber_count": subscriber_count
        })
    
    return {
        "id": trader.id,
        "name": trader.name or user.email.split('@')[0],
        "email": user.email,
        "sebi_reg": trader.sebi_reg,
        "image_url": trader.image_url,
        "bio": trader.bio,
        "trades_per_day": trader.trades_per_day,
        "total_services": len(services),
        "total_subscribers": total_subscribers,
        "recent_trades_30d": recent_trades,
        "services": services_data,
        "approved_at": trader.approved_at
    }

