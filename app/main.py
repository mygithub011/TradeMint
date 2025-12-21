
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.db.database import Base, engine
from app.routers import auth, traders, services, subscriptions, admin, alerts
from app.services.scheduler import start_scheduler, shutdown_scheduler

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

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Smart Trade API...")
    start_scheduler()

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Smart Trade API...")
    shutdown_scheduler()


# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://*.vercel.app",  # Vercel deployments
        "https://*.netlify.app",  # Netlify deployments
        "https://*.render.com",   # Render deployments
        "*"  # Allow all for development (remove in production)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(traders.router)
app.include_router(services.router)
app.include_router(subscriptions.router)
app.include_router(admin.router)
app.include_router(alerts.router)

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

