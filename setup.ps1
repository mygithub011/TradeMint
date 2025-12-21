# Smart Trade Backend Setup Script for Windows PowerShell

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Smart Trade Backend Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

# Create virtual environment
Write-Host ""
Write-Host "Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "Virtual environment already exists. Skipping..." -ForegroundColor Yellow
} else {
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host ""
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host ""
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
Write-Host ""
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host ".env file already exists. Skipping..." -ForegroundColor Yellow
} else {
    Copy-Item .env.example .env
    Write-Host "✓ Created .env file from .env.example" -ForegroundColor Green
    Write-Host "⚠ IMPORTANT: Edit .env and update SECRET_KEY and TELEGRAM_BOT_TOKEN" -ForegroundColor Yellow
}

# Create uploads directory
Write-Host ""
Write-Host "Creating uploads directory..." -ForegroundColor Yellow
if (!(Test-Path "uploads\certificates")) {
    New-Item -ItemType Directory -Path "uploads\certificates" -Force | Out-Null
    Write-Host "✓ Uploads directory created" -ForegroundColor Green
} else {
    Write-Host "Uploads directory already exists. Skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file and update SECRET_KEY and TELEGRAM_BOT_TOKEN (optional)" -ForegroundColor White
Write-Host "2. Run: uvicorn app.main:app --reload" -ForegroundColor White
Write-Host "3. Open: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see README.md" -ForegroundColor Yellow
Write-Host ""
