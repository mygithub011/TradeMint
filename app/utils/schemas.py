from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    TRADER = "trader"
    CLIENT = "client"

class SubscriptionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class ServiceType(str, Enum):
    EQUITY_INTRADAY = "Equity Intraday"
    FNO = "F&O"
    SWING = "Swing Trading"
    POSITIONAL = "Positional"

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole

class UserLogin(BaseModel):
    username: EmailStr  # OAuth2 requires 'username' field
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    created_at: datetime
    name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    pan: Optional[str] = None
    profile_photo: Optional[str] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    """Schema for updating user profile"""
    name: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    pan: Optional[str] = None

class UserProfileResponse(BaseModel):
    """Complete user profile response"""
    id: int
    email: str
    role: str
    name: Optional[str]
    phone: Optional[str]
    dob: Optional[str]
    gender: Optional[str]
    pan: Optional[str]
    profile_photo: Optional[str]
    enrolled_courses: int = 0
    
    class Config:
        from_attributes = True

# Trader Schemas
class TraderOnboard(BaseModel):
    sebi_reg: str = Field(..., min_length=5, max_length=50)
    pan_card: str = Field(..., min_length=10, max_length=10, description="PAN card number")
    name: str = Field(..., min_length=2, max_length=100, description="Trader display name")
    bio: Optional[str] = Field(None, max_length=500, description="Short bio/description")
    image_url: Optional[str] = Field(None, max_length=500, description="Profile image URL")
    trades_per_day: Optional[int] = Field(0, ge=0, le=100, description="Average trades per day")

    @validator('pan_card')
    def validate_pan(cls, v):
        v = v.upper()
        # Basic PAN format validation: 5 letters, 4 digits, 1 letter
        import re
        if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', v):
            raise ValueError('Invalid PAN card format. Format should be: ABCDE1234F')
        return v

class TraderProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = Field(None, max_length=500)
    trades_per_day: Optional[int] = Field(None, ge=0, le=100)

class TraderResponse(BaseModel):
    id: int
    user_id: int
    name: Optional[str]
    sebi_reg: str
    pan_card: str
    certificate_path: Optional[str]
    image_url: Optional[str]
    bio: Optional[str]
    trades_per_day: int
    approved: bool
    approved_at: Optional[datetime]
    rejection_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class TraderApprove(BaseModel):
    trader_id: int

# Service Schemas
class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    price: int = Field(..., gt=0, description="Price in INR")
    duration_days: int = Field(..., gt=0, description="Subscription duration in days")
    pricing_tiers: Optional[str] = Field(None, description="JSON string of pricing tiers")
    telegram_group_id: Optional[str] = None

class ServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    price: Optional[int] = Field(None, gt=0)
    duration_days: Optional[int] = Field(None, gt=0)
    pricing_tiers: Optional[str] = None
    telegram_group_id: Optional[str] = None
    is_active: Optional[bool] = None

class ServiceResponse(BaseModel):
    id: int
    trader_id: int
    name: str
    description: Optional[str]
    price: int
    duration_days: int
    pricing_tiers: Optional[str]
    telegram_group_id: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Subscription Schemas
class SubscriptionCreate(BaseModel):
    service_id: int
    telegram_user_id: Optional[str] = None

class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    service_id: int
    start_date: datetime
    end_date: datetime
    status: str
    telegram_user_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Trade Alert Schemas
class TradeAlertCreate(BaseModel):
    service_id: int
    stock_symbol: str = Field(..., min_length=1, description="Stock/Contract symbol")
    action: str = Field(..., pattern="^(BUY|SELL)$", description="Trade action")
    lot_size: Optional[int] = Field(None, gt=0, description="Lot size")
    rate: Optional[float] = Field(None, gt=0, description="Entry rate/price")
    target: Optional[float] = Field(None, gt=0, description="Target price")
    stop_loss: Optional[float] = Field(None, gt=0, description="Stop loss price")
    cmp: Optional[float] = Field(None, gt=0, description="Current market price")
    validity: Optional[str] = Field(None, description="Validity date (DD/MM/YYYY)")

class TradeAlertResponse(BaseModel):
    id: int
    service_id: int
    trader_id: int
    sent_at: datetime
    stock_symbol: str
    action: str
    lot_size: Optional[int]
    rate: Optional[float]
    target: Optional[float]
    stop_loss: Optional[float]
    cmp: Optional[float]
    validity: Optional[str]

    class Config:
        from_attributes = True

class ClientAlertResponse(BaseModel):
    """Alert response for clients with additional context"""
    id: int
    alert_id: int
    service_id: int
    service_name: str
    trader_name: str
    sent_at: datetime
    received_at: datetime
    is_read: bool
    read_at: Optional[datetime]
    
    # Trade details
    stock_symbol: str
    action: str
    lot_size: Optional[int]
    rate: Optional[str]
    target: Optional[str]
    stop_loss: Optional[str]
    cmp: Optional[str]
    validity: Optional[str]

    class Config:
        from_attributes = True
