"""
Vercel Serverless Handler for FastAPI
This file serves as the entry point for Vercel serverless deployment
"""

from app.main import app

# Export the FastAPI app for Vercel
handler = app

# For local testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
