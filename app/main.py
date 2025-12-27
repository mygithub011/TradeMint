
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from app.db.database import Base, engine
from app.routers import auth, traders, services, subscriptions, admin, alerts, marketplace, payments, cron

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)
logger.info("Database tables created successfully")

# Initialize FastAPI app
app = FastAPI(
    title="Smart Trade API",
    description="SEBI-compliant trade subscription platform for distributing trade ideas",
    version="1.0.0"
)

# Startup event - Only run scheduler in non-serverless environments
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Smart Trade API...")
    
    # Only start scheduler if not in Vercel serverless environment
    if not os.getenv("VERCEL"):
        from app.services.scheduler import start_scheduler
        start_scheduler()
        logger.info("Background scheduler started")
    else:
        logger.info("Running in serverless mode - scheduler disabled (use Vercel Cron)")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Smart Trade API...")
    
    # Only shutdown scheduler if it was started
    if not os.getenv("VERCEL"):
        from app.services.scheduler import shutdown_scheduler
        shutdown_scheduler()
        logger.info("Background scheduler stopped")


# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(traders.router)
app.include_router(services.router)
app.include_router(subscriptions.router)
app.include_router(admin.router)
app.include_router(alerts.router)
app.include_router(marketplace.router)
app.include_router(payments.router)
app.include_router(cron.router)

@app.get("/", tags=["Root"])
def root():
    """Root endpoint - API health check."""
    return {
        "status": "online",
        "message": "Smart Trade API is running",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health", tags=["Root"])
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected"
    }

