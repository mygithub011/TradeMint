from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Server Settings
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # JWT Settings
    SECRET_KEY: str = "your-secret-key-change-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./smarttrade.db"  # Fallback for local development
    )
    DATABASE_URL_UNPOOLED: Optional[str] = None  # Optional unpooled connection for migrations
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: Optional[str] = "8358386533:AAG-zmUuYFUMF0Mq5LX6Vq7TzB-PLW9lpZM"
    
    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")
    
    # File Upload
    UPLOAD_DIR: str = "./uploads/certificates"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    # Scheduler
    EXPIRY_CHECK_INTERVAL_MINUTES: int = 60  # Check every hour
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields from .env

settings = Settings()
