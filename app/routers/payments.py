from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
import logging

from app.models.models import Payment, Subscription, Service, User
from app.utils.dependencies import get_current_user, get_db
from app.services.razorpay_service import razorpay_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])

# ============================================================================
# REQUEST/RESPONSE SCHEMAS
# ============================================================================

class CreateOrderRequest(BaseModel):
    service_id: int
    custom_price: Optional[int] = None
    custom_duration: Optional[int] = None

class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    service_id: int

class PaymentResponse(BaseModel):
    id: int
    razorpay_order_id: str
    razorpay_payment_id: Optional[str]
    amount: float
    currency: str
    status: str
    created_at: datetime
    paid_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# ============================================================================
# PAYMENT ENDPOINTS
# ============================================================================

@router.post("/create-order", response_model=CreateOrderResponse)
async def create_payment_order(
    request: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 1: Create a Razorpay order and payment record.
    This initiates the payment process.
    """
    # Verify user is a client
    if current_user.role != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can subscribe to services"
        )
    
    # Get service details
    service = db.query(Service).filter(Service.id == request.service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    if not service.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service is not active"
        )
    
    # Check if user already has an active subscription for this service
    existing_sub = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.service_id == service.id,
        Subscription.status == "ACTIVE"
    ).first()
    
    if existing_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active subscription for this service"
        )
    
    try:
        # Use custom price if provided, otherwise use service default price
        actual_price = request.custom_price if request.custom_price is not None else service.price
        actual_duration = request.custom_duration if request.custom_duration is not None else service.duration_days
        
        # Convert price to paise (smallest currency unit)
        amount_paise = actual_price * 100
        
        # Create Razorpay order
        razorpay_order = razorpay_service.create_order(
            amount=amount_paise,
            currency="INR",
            receipt=f"service_{service.id}_user_{current_user.id}",
            notes={
                "service_id": str(service.id),
                "service_name": service.name,
                "user_id": str(current_user.id),
                "user_email": current_user.email,
                "duration_days": str(actual_duration)
            }
        )
        
        # ACID Transaction: Create payment record in database
        # This ensures atomicity - either both Razorpay order and DB record are created, or neither
        payment = Payment(
            razorpay_order_id=razorpay_order["id"],
            user_id=current_user.id,
            service_id=service.id,
            amount=actual_price,
            currency="INR",
            status="CREATED",
            email=current_user.email
        )
        
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        logger.info(f"Payment order created: {payment.id} for user {current_user.id}, service {service.id}")
        
        # Return order details for frontend
        from app.utils.config import settings
        return CreateOrderResponse(
            order_id=razorpay_order["id"],
            amount=amount_paise,
            currency="INR",
            key_id=settings.RAZORPAY_KEY_ID
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating payment order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment order: {str(e)}"
        )


@router.post("/verify")
async def verify_payment(
    request: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Step 2: Verify payment signature and create subscription.
    This ensures payment authenticity and creates the subscription atomically.
    
    ACID Compliance:
    - Atomicity: All operations (payment verification, subscription creation) happen together
    - Consistency: Database constraints ensure data integrity
    - Isolation: Transaction isolation prevents concurrent issues
    - Durability: Once committed, changes are permanent
    """
    # Verify signature
    is_valid = razorpay_service.verify_payment_signature(
        razorpay_order_id=request.razorpay_order_id,
        razorpay_payment_id=request.razorpay_payment_id,
        razorpay_signature=request.razorpay_signature
    )
    
    if not is_valid:
        logger.error(f"Invalid payment signature for order {request.razorpay_order_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature. Payment verification failed."
        )
    
    # Start ACID transaction
    try:
        # Get payment record
        payment = db.query(Payment).filter(
            Payment.razorpay_order_id == request.razorpay_order_id,
            Payment.user_id == current_user.id
        ).first()
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found"
            )
        
        # Check if payment already processed
        if payment.status == "CAPTURED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment already processed"
            )
        
        # Get service details for subscription
        service = db.query(Service).filter(Service.id == request.service_id).first()
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        # Fetch payment details from Razorpay
        payment_details = razorpay_service.get_payment_details(request.razorpay_payment_id)
        
        # Update payment record - ACID ensures this is atomic
        payment.razorpay_payment_id = request.razorpay_payment_id
        payment.razorpay_signature = request.razorpay_signature
        payment.status = "CAPTURED"
        payment.paid_at = datetime.utcnow()
        
        if payment_details:
            payment.payment_method = payment_details.get("method")
            payment.contact = payment_details.get("contact")
        
        # Retrieve custom duration from order notes if available
        actual_duration = service.duration_days  # Default to service duration
        try:
            order_details = razorpay_service.client.order.fetch(request.razorpay_order_id)
            if order_details and "notes" in order_details and "duration_days" in order_details["notes"]:
                actual_duration = int(order_details["notes"]["duration_days"])
        except Exception as e:
            logger.warning(f"Could not fetch order details for custom duration: {e}")
        
        # Calculate subscription dates based on transaction date
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=actual_duration)
        
        # Create subscription - linked to payment for audit trail
        subscription = Subscription(
            user_id=current_user.id,
            service_id=service.id,
            payment_id=payment.id,
            start_date=start_date,
            end_date=end_date,
            status="ACTIVE"
        )
        
        db.add(subscription)
        
        # Commit transaction - ACID compliance
        # If any operation fails, entire transaction rolls back
        db.commit()
        db.refresh(payment)
        db.refresh(subscription)
        
        logger.info(f"Payment verified and subscription created: Payment ID {payment.id}, Subscription ID {subscription.id}")
        
        return {
            "success": True,
            "message": "Payment successful! Subscription activated.",
            "subscription": {
                "id": subscription.id,
                "service_name": service.name,
                "start_date": subscription.start_date.isoformat(),
                "end_date": subscription.end_date.isoformat(),
                "status": subscription.status
            },
            "payment": {
                "id": payment.id,
                "amount": payment.amount,
                "razorpay_payment_id": payment.razorpay_payment_id,
                "paid_at": payment.paid_at.isoformat() if payment.paid_at else None
            }
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error verifying payment: {e}")
        
        # Update payment status to failed
        if payment:
            payment.status = "FAILED"
            payment.error_description = str(e)
            db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification failed: {str(e)}"
        )


@router.get("/my-payments", response_model=list[PaymentResponse])
async def get_my_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all payments made by the current user."""
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).all()
    
    return payments


@router.get("/payment/{payment_id}", response_model=PaymentResponse)
async def get_payment_details(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific payment."""
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    return payment
