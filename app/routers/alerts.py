from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models.models import TradeAlert, Service, Trader, User
from app.utils.dependencies import get_current_trader, get_db
from app.utils.schemas import TradeAlertCreate, TradeAlertResponse
from app.services.telegram_group_manager import telegram_group_manager
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/alerts", tags=["Trade Alerts"])

@router.post("/", response_model=TradeAlertResponse, status_code=status.HTTP_201_CREATED)
async def send_trade_alert(
    alert_data: TradeAlertCreate,
    current_user: User = Depends(get_current_trader),
    db: Session = Depends(get_db)
):
    """Send a trade alert to service subscribers (trader only)."""
    # Get trader record
    trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    
    if not trader or not trader.approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only approved traders can send trade alerts"
        )
    
    # Verify service belongs to this trader
    service = db.query(Service).filter(
        Service.id == alert_data.service_id,
        Service.trader_id == trader.id
    ).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found or you don't have access"
        )
    
    if not service.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send alerts for inactive services"
        )
    
    # Create trade alert record
    new_alert = TradeAlert(
        service_id=service.id,
        trader_id=trader.id,
        stock_symbol=alert_data.stock_symbol,
        action=alert_data.action,
        lot_size=alert_data.lot_size,
        rate=str(alert_data.rate) if alert_data.rate else None,
        target=str(alert_data.target) if alert_data.target else None,
        stop_loss=str(alert_data.stop_loss) if alert_data.stop_loss else None,
        cmp=str(alert_data.cmp) if alert_data.cmp else None,
        validity=alert_data.validity
    )
    
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    # Send to Telegram group if configured
    if service.telegram_group_id:
        try:
            from app.services.telegram_service import TelegramService
            telegram_service = TelegramService()
            
            # Prepare alert data for formatting
            alert_dict = {
                "action": alert_data.action,
                "stock_symbol": alert_data.stock_symbol,
                "lot_size": alert_data.lot_size,
                "rate": alert_data.rate,
                "target": alert_data.target,
                "stop_loss": alert_data.stop_loss,
                "cmp": alert_data.cmp,
                "validity": alert_data.validity
            }
            
            # Format and send message
            formatted_message = telegram_service.format_trade_alert_message(alert_dict)
            success = await telegram_service.send_trade_alert(
                group_id=service.telegram_group_id,
                message=formatted_message
            )
            
            if success:
                logger.info(f"Alert {new_alert.id} sent to {service.name} Telegram group {service.telegram_group_id}")
            else:
                logger.warning(f"Failed to send alert {new_alert.id} to Telegram group")
        except Exception as e:
            logger.error(f"Error sending Telegram alert: {str(e)}", exc_info=True)
            # Don't fail the alert creation - Telegram is optional
    else:
        logger.info(f"No Telegram group configured for service {service.name}, alert saved to database only")
    
    return new_alert

@router.get("/service/{service_id}", response_model=List[TradeAlertResponse])
def get_service_alerts(
    service_id: int,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_trader),
    db: Session = Depends(get_db)
):
    """Get all trade alerts for a specific service (trader only)."""
    # Get trader record
    trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only traders can access this endpoint"
        )
    
    # Verify service belongs to this trader
    service = db.query(Service).filter(
        Service.id == service_id,
        Service.trader_id == trader.id
    ).first()
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found or you don't have access"
        )
    
    alerts = db.query(TradeAlert).filter(
        TradeAlert.service_id == service_id
    ).order_by(TradeAlert.sent_at.desc()).offset(skip).limit(limit).all()
    
    return alerts

@router.get("/my-alerts", response_model=List[TradeAlertResponse])
def get_my_alerts(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_trader),
    db: Session = Depends(get_db)
):
    """Get all trade alerts sent by current trader."""
    trader = db.query(Trader).filter(Trader.user_id == current_user.id).first()
    
    if not trader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trader profile not found"
        )
    
    alerts = db.query(TradeAlert).filter(
        TradeAlert.trader_id == trader.id
    ).order_by(TradeAlert.sent_at.desc()).offset(skip).limit(limit).all()
    
    return alerts
