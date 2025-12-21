
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime
from app.models.models import Trader, User, Service
from app.utils.dependencies import get_current_user, get_current_trader, get_db
from app.utils.schemas import TraderOnboard, TraderResponse, ServiceCreate, ServiceResponse
from app.utils.config import settings

router = APIRouter(prefix="/traders", tags=["Traders"])

@router.post("/onboard", response_model=TraderResponse, status_code=status.HTTP_201_CREATED)
async def onboard_trader(
    trader_data: TraderOnboard,
    certificate: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Onboard a new trader with SEBI registration."""
    # Verify user is a trader
    if current_user.role != "trader":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with trader role can onboard as traders"
        )
    
    # Check if trader already exists
    existing_trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    if existing_trader:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already onboarded as trader"
        )
    
    # Check if SEBI registration number is unique
    existing_sebi = db.query(Trader).filter(Trader.sebi_reg == trader_data.sebi_reg).first()
    if existing_sebi:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SEBI registration number already exists"
        )
    
    certificate_path = None
    
    # Handle certificate upload
    if certificate:
        # Validate file size
        if certificate.size and certificate.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum limit of {settings.MAX_FILE_SIZE} bytes"
            )
        
        # Create upload directory if it doesn't exist
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        # Save file
        file_extension = os.path.splitext(certificate.filename)[1]
        filename = f"{current_user.id}_{trader_data.sebi_reg}{file_extension}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(certificate.file, buffer)
        
        certificate_path = file_path
    
    # Create trader record
    new_trader = Trader(
        user_id=current_user.id,
        sebi_reg=trader_data.sebi_reg,
        certificate_path=certificate_path,
        approved=False
    )
    
    db.add(new_trader)
    db.commit()
    db.refresh(new_trader)
    
    return new_trader

@router.get("/me", response_model=TraderResponse)
def get_my_trader_profile(
    current_user: User = Depends(get_current_trader),
    db: Session = Depends(get_db)
):
    """Get current trader's profile."""
    trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trader profile not found. Please onboard first."
        )
    return trader

@router.post("/services", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_data: ServiceCreate,
    current_user: User = Depends(get_current_trader),
    db: Session = Depends(get_db)
):
    """Create a new trading service (only for approved traders)."""
    # Get trader record
    trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trader profile not found. Please onboard first."
        )
    
    if not trader.approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trader must be approved by admin before creating services"
        )
    
    # Create service
    new_service = Service(
        trader_id=trader.id,
        name=service_data.name,
        description=service_data.description,
        price=service_data.price,
        duration_days=service_data.duration_days,
        telegram_group_id=service_data.telegram_group_id,
        is_active=True
    )
    
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    
    return new_service

@router.get("/services", response_model=List[ServiceResponse])
def get_my_services(
    current_user: User = Depends(get_current_trader),
    db: Session = Depends(get_db)
):
    """Get all services created by current trader."""
    trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trader profile not found"
        )
    
    services = db.query(Service).filter(Service.trader_id == trader.id).all()
    return services

@router.get("/all", response_model=List[TraderResponse])
def get_all_traders(
    skip: int = 0,
    limit: int = 100,
    approved: bool = None,
    db: Session = Depends(get_db)
):
    """Get all traders (public endpoint for clients to browse)."""
    query = db.query(Trader)
    
    if approved is not None:
        query = query.filter(Trader.approved == approved)
    
    traders = query.offset(skip).limit(limit).all()
    return traders

