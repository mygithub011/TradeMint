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

    class Config:
        from_attributes = True

# Trader Schemas
class TraderOnboard(BaseModel):
    sebi_reg: str = Field(..., min_length=5, max_length=50)

class TraderResponse(BaseModel):
    id: int
    user_id: int
    sebi_reg: str
    certificate_path: Optional[str]
    approved: bool
    approved_at: Optional[datetime]
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
    telegram_group_id: Optional[str] = None

    @validator('duration_days')
    def validate_duration(cls, v):
        allowed_durations = [30, 90, 180, 365]
        if v not in allowed_durations:
            raise ValueError(f'Duration must be one of {allowed_durations}')
        return v

class ServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    price: Optional[int] = Field(None, gt=0)
    duration_days: Optional[int] = Field(None, gt=0)
    telegram_group_id: Optional[str] = None
    is_active: Optional[bool] = None

class ServiceResponse(BaseModel):
    id: int
    trader_id: int
    name: str
    description: Optional[str]
    price: int
    duration_days: int
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
    message: str = Field(..., min_length=10)
    stock_symbol: Optional[str] = None
    action: Optional[str] = Field(None, pattern="^(BUY|SELL|HOLD)$")
    target_price: Optional[str] = None
    stop_loss: Optional[str] = None

class TradeAlertResponse(BaseModel):
    id: int
    service_id: int
    trader_id: int
    message: str
    sent_at: datetime
    stock_symbol: Optional[str]
    action: Optional[str]

    class Config:
        from_attributes = True
