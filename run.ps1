# Smart Trade Backend Run Script

Write-Host "Starting Smart Trade API..." -ForegroundColor Cyan

# Check if virtual environment exists
if (!(Test-Path "venv")) {
    Write-Host "Virtual environment not found. Running setup..." -ForegroundColor Yellow
    & .\setup.ps1
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Start the server
Write-Host ""
Write-Host "Starting FastAPI server..." -ForegroundColor Green
Write-Host "API: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --reload
