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
    DATABASE_URL: str = "sqlite:///./smarttrade.db"
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    
    # File Upload
    UPLOAD_DIR: str = "./uploads/certificates"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    # Scheduler
    EXPIRY_CHECK_INTERVAL_MINUTES: int = 60  # Check every hour
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
