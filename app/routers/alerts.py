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
        message=alert_data.message,
        stock_symbol=alert_data.stock_symbol,
        action=alert_data.action,
        target_price=alert_data.target_price,
        stop_loss=alert_data.stop_loss
    )
    
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    # Send to Telegram group if configured
    # All active subscribers will receive this alert in the service group
    if service.telegram_group_id:
        try:
            # Format message with trade details
            formatted_message = f"<b>📊 Trade Alert</b>\n\n{alert_data.message}"
            if alert_data.stock_symbol:
                formatted_message += f"\n\n<b>Symbol:</b> {alert_data.stock_symbol}"
            if alert_data.action:
                formatted_message += f"\n<b>Action:</b> {alert_data.action}"
            if alert_data.target_price:
                formatted_message += f"\n<b>Target:</b> {alert_data.target_price}"
            if alert_data.stop_loss:
                formatted_message += f"\n<b>Stop Loss:</b> {alert_data.stop_loss}"
            
            success = await telegram_group_manager.send_alert_to_service_group(
                group_id=service.telegram_group_id,
                message=formatted_message
            )
            
            if success:
                logger.info(f"Alert {new_alert.id} sent to {service.name} group")
            else:
                logger.warning(f"Failed to send alert {new_alert.id} to Telegram group")
        except Exception as e:
            logger.error(f"Error sending Telegram alert: {e}")
            # Don't fail the alert creation - Telegram is optional
    
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
