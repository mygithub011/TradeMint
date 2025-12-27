
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.models import Service, Trader, User
from app.utils.schemas import ServiceResponse, ServiceUpdate
from app.utils.dependencies import get_db, get_current_user

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

@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    service_update: ServiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a service (trader only)."""
    # Get the service
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Get trader profile
    trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only traders can update services"
        )
    
    # Check if the service belongs to the trader
    if service.trader_id != trader.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own services"
        )
    
    # Update only the provided fields
    update_data = service_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(service, field, value)
    
    db.commit()
    db.refresh(service)
    return service

@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a service (trader only)."""
    # Get the service
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Get trader profile
    trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only traders can delete services"
        )
    
    # Check if the service belongs to the trader
    if service.trader_id != trader.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own services"
        )
    
    db.delete(service)
    db.commit()
    return {"message": "Service deleted successfully"}
