
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
from app.models.models import Trader, User, Service
from app.utils.dependencies import get_current_user, get_current_trader, get_db
from app.utils.schemas import TraderOnboard, TraderResponse, ServiceCreate, ServiceResponse
from app.utils.config import settings
from app.services.telegram_group_manager import telegram_group_manager
import logging

logger = logging.getLogger(__name__)

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


# ============================================================================
# TELEGRAM GROUP MANAGEMENT ENDPOINTS
# ============================================================================

@router.post("/services/{service_id}/telegram-group/create")
async def create_telegram_group_for_service(
    service_id: int,
    current_user: User = Depends(get_current_trader),
    db: Session = Depends(get_db)
):
    """
    Create a Telegram group for a service.
    One group per service - all subscribers will be added to this group.
    
    Returns:
    - group_id: Chat ID to store in service
    - invite_link: Shareable invite link for customers
    """
    # Get trader record
    trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trader profile not found"
        )
    
    # Get service
    service = db.query(Service).filter(
        Service.id == service_id,
        Service.trader_id == trader.id
    ).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found or you don't have access"
        )
    
    if service.telegram_group_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This service already has a Telegram group"
        )
    
    try:
        # Create the group
        group_id = await telegram_group_manager.create_service_group(
            service_name=service.name,
            trader_name=trader.user.email.split('@')[0],  # Use email prefix as trader name
            description=service.description
        )
        
        if not group_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create Telegram group. Ensure bot token is configured."
            )
        
        # Generate permanent invite link
        invite_link = await telegram_group_manager.generate_invite_link(
            group_id=group_id,
            is_permanent=True
        )
        
        # Update service with group details
        service.telegram_group_id = group_id
        service.telegram_group_link = invite_link
        db.commit()
        db.refresh(service)
        
        logger.info(f"Created Telegram group {group_id} for service {service.name}")
        
        return {
            "status": "success",
            "service_id": service.id,
            "service_name": service.name,
            "group_id": group_id,
            "invite_link": invite_link,
            "message": "Telegram group created successfully. Share the invite link with your customers."
        }
        
    except Exception as e:
        logger.error(f"Error creating Telegram group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create Telegram group: {str(e)}"
        )


@router.get("/services/{service_id}/telegram-group/info")
async def get_telegram_group_info(
    service_id: int,
    current_user: User = Depends(get_current_trader),
    db: Session = Depends(get_db)
):
    """Get information about a service's Telegram group."""
    # Get trader record
    trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trader profile not found"
        )
    
    # Get service
    service = db.query(Service).filter(
        Service.id == service_id,
        Service.trader_id == trader.id
    ).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found or you don't have access"
        )
    
    if not service.telegram_group_id:
        return {
            "status": "not_configured",
            "message": "No Telegram group configured for this service"
        }
    
    try:
        # Verify bot is admin
        is_admin = await telegram_group_manager.verify_bot_admin_in_group(
            group_id=service.telegram_group_id
        )
        
        # Get group info
        group_info = await telegram_group_manager.get_group_info(
            group_id=service.telegram_group_id
        )
        
        # Get subscriber count
        from app.models.models import Subscription
        subscriber_count = db.query(Subscription).filter(
            Subscription.service_id == service.id,
            Subscription.status == "ACTIVE"
        ).count()
        
        return {
            "status": "success",
            "service_id": service.id,
            "service_name": service.name,
            "group_id": service.telegram_group_id,
            "invite_link": service.telegram_group_link,
            "bot_is_admin": is_admin,
            "group_info": group_info,
            "active_subscribers": subscriber_count
        }
        
    except Exception as e:
        logger.error(f"Error getting group info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get group information: {str(e)}"
        )


@router.post("/services/{service_id}/telegram-group/test-alert")
async def send_test_alert(
    service_id: int,
    message: str = "🔔 Test Alert - Your Telegram group is working!",
    current_user: User = Depends(get_current_trader),
    db: Session = Depends(get_db)
):
    """Send a test alert to the service's Telegram group."""
    # Get trader record
    trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trader profile not found"
        )
    
    # Get service
    service = db.query(Service).filter(
        Service.id == service_id,
        Service.trader_id == trader.id
    ).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found or you don't have access"
        )
    
    if not service.telegram_group_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Telegram group configured for this service"
        )
    
    try:
        success = await telegram_group_manager.send_alert_to_service_group(
            group_id=service.telegram_group_id,
            message=f"<b>🧪 Test Alert</b>\n\n{message}\n\n<i>This is a test message to verify group functionality.</i>"
        )
        
        if success:
            logger.info(f"Test alert sent to service {service.name}")
            return {
                "status": "success",
                "message": "Test alert sent successfully to the group"
            }
        else:
            return {
                "status": "failed",
                "message": "Failed to send test alert. Check bot permissions."
            }
            
    except Exception as e:
        logger.error(f"Error sending test alert: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test alert: {str(e)}"
        )


@router.post("/services/{service_id}/telegram-group/generate-link")
async def generate_group_invite_link(
    service_id: int,
    is_permanent: bool = False,
    current_user: User = Depends(get_current_trader),
    db: Session = Depends(get_db)
):
    """
    Generate a new invite link for the service's Telegram group.
    
    - is_permanent=True: Creates a reusable permanent link
    - is_permanent=False: Creates a single-use link (recommended for security)
    """
    # Get trader record
    trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trader profile not found"
        )
    
    # Get service
    service = db.query(Service).filter(
        Service.id == service_id,
        Service.trader_id == trader.id
    ).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found or you don't have access"
        )
    
    if not service.telegram_group_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Telegram group configured for this service"
        )
    
    try:
        invite_link = await telegram_group_manager.generate_invite_link(
            group_id=service.telegram_group_id,
            is_permanent=is_permanent
        )
        
        if not invite_link:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate invite link"
            )
        
        # Update permanent link if requested
        if is_permanent:
            service.telegram_group_link = invite_link
            db.commit()
        
        logger.info(f"Generated {'permanent' if is_permanent else 'single-use'} invite link for service {service.name}")
        
        return {
            "status": "success",
            "invite_link": invite_link,
            "type": "permanent" if is_permanent else "single-use",
            "message": "Invite link generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error generating invite link: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate invite link: {str(e)}"
        )