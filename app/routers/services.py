
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.models import Service, Trader
from app.utils.schemas import ServiceResponse
from app.utils.dependencies import get_db

router = APIRouter(prefix="/services", tags=["Services"])

@router.get("/", response_model=List[ServiceResponse])
def list_services(
    skip: int = 0,
    limit: int = 100,
    trader_id: Optional[int] = None,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    """List all available trading services."""
    query = db.query(Service)
    
    if trader_id is not None:
        query = query.filter(Service.trader_id == trader_id)
    
    if is_active is not None:
        query = query.filter(Service.is_active == is_active)
    
    # Only show services from approved traders
    query = query.join(Trader).filter(Trader.approved == True)
    
    services = query.offset(skip).limit(limit).all()
    return services

@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific service."""
    service = db.query(Service).filter(Service.id == service_id).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Check if trader is approved
    trader = db.query(Trader).filter(Trader.id == service.trader_id).first()
    if not trader or not trader.approved:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not available"
        )
    
    return service

@router.get("/trader/{trader_id}", response_model=List[ServiceResponse])
def get_services_by_trader(
    trader_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all services offered by a specific trader."""
    # Verify trader exists and is approved
    trader = db.query(Trader).filter(Trader.id == trader_id, Trader.approved == True).first()
    
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trader not found or not approved"
        )
    
    services = db.query(Service).filter(
        Service.trader_id == trader_id,
        Service.is_active == True
    ).offset(skip).limit(limit).all()
    
    return services

