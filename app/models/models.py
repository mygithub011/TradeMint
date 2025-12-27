
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, trader, client
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    trader = relationship("Trader", back_populates="user", uselist=False)
    subscriptions = relationship("Subscription", back_populates="user")

class Trader(Base):
    __tablename__ = "traders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String, nullable=True)  # Trader display name
    sebi_reg = Column(String, unique=True, nullable=False)
    pan_card = Column(String, unique=True, nullable=False)  # PAN card number
    certificate_path = Column(String)  # Path to uploaded SEBI certificate
    image_url = Column(String, nullable=True)  # Profile image URL
    bio = Column(Text, nullable=True)  # Short bio/description
    trades_per_day = Column(Integer, default=0)  # Average trades per day
    approved = Column(Boolean, default=False)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, nullable=True)  # Removed ForeignKey to avoid ambiguity
    rejection_reason = Column(Text, nullable=True)  # Reason for rejection
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="trader", foreign_keys=[user_id])
    services = relationship("Service", back_populates="trader")

class Service(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    trader_id = Column(Integer, ForeignKey("traders.id"), nullable=False)
    name = Column(String, nullable=False)  # Equity Intraday / F&O / Swing
    description = Column(Text)
    price = Column(Integer, nullable=False)  # Default/base price in INR (for backward compatibility)
    duration_days = Column(Integer, nullable=False)  # Default duration (for backward compatibility)
    pricing_tiers = Column(Text, nullable=True)  # JSON string: {"weekly": 999, "monthly": 2999, "quarterly": 7999, "yearly": 24999}
    telegram_group_id = Column(String, nullable=True)  # Telegram private group ID (chat_id)
    telegram_group_link = Column(String, nullable=True)  # Telegram group invite link
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    trader = relationship("Trader", back_populates="services")
    subscriptions = relationship("Subscription", back_populates="service")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)  # Link to payment
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, ACTIVE, EXPIRED, CANCELLED
    telegram_user_id = Column(String, nullable=True)  # User's Telegram ID
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")
    service = relationship("Service", back_populates="subscriptions")
    payment = relationship("Payment", back_populates="subscription", uselist=False)

class TradeAlert(Base):
    __tablename__ = "trade_alerts"
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    trader_id = Column(Integer, ForeignKey("traders.id"), nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    
    # Trade details
    stock_symbol = Column(String, nullable=False)
    action = Column(String, nullable=False)  # BUY, SELL
    lot_size = Column(Integer, nullable=True)
    rate = Column(String, nullable=True)  # Entry rate
    target = Column(String, nullable=True)  # Target price
    stop_loss = Column(String, nullable=True)  # Stop loss price
    cmp = Column(String, nullable=True)  # Current market price
    validity = Column(String, nullable=True)  # Validity date

class Payment(Base):
    """Payment model to track all transactions with ACID compliance"""
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    
    # Razorpay IDs
    razorpay_order_id = Column(String, unique=True, nullable=False, index=True)
    razorpay_payment_id = Column(String, unique=True, nullable=True, index=True)
    razorpay_signature = Column(String, nullable=True)
    
    # Payment Details
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    amount = Column(Float, nullable=False)  # Amount in INR
    currency = Column(String, default="INR")
    status = Column(String, default="CREATED")  # CREATED, AUTHORIZED, CAPTURED, FAILED, REFUNDED
    
    # Transaction metadata
    payment_method = Column(String, nullable=True)  # card, netbanking, upi, wallet
    email = Column(String, nullable=True)
    contact = Column(String, nullable=True)
    
    # Timestamps for ACID compliance and audit trail
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    paid_at = Column(DateTime, nullable=True)  # When payment was completed
    refunded_at = Column(DateTime, nullable=True)  # If refund was issued
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Error tracking
    error_code = Column(String, nullable=True)
    error_description = Column(Text, nullable=True)
    
    # Relationships
    subscription = relationship("Subscription", back_populates="payment")

