
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
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
    sebi_reg = Column(String, unique=True, nullable=False)
    certificate_path = Column(String)  # Path to uploaded SEBI certificate
    approved = Column(Boolean, default=False)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, nullable=True)  # Removed ForeignKey to avoid ambiguity
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
    price = Column(Integer, nullable=False)  # Price in INR
    duration_days = Column(Integer, nullable=False)  # 30, 90, etc.
    telegram_group_id = Column(String, nullable=True)  # Telegram private group ID
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
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=False)
    status = Column(String, default="ACTIVE")  # ACTIVE, EXPIRED, CANCELLED
    telegram_user_id = Column(String, nullable=True)  # User's Telegram ID
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="subscriptions")
    service = relationship("Service", back_populates="subscriptions")

class TradeAlert(Base):
    __tablename__ = "trade_alerts"
    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    trader_id = Column(Integer, ForeignKey("traders.id"), nullable=False)
    message = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    
    # For audit trail
    stock_symbol = Column(String, nullable=True)
    action = Column(String, nullable=True)  # BUY, SELL, HOLD
    target_price = Column(String, nullable=True)
    stop_loss = Column(String, nullable=True)

