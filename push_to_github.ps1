# Quick Deploy Script for Smart Trade Backend
# Run this after creating a GitHub repository

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   Smart Trade Backend - GitHub Push Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Get GitHub username and repo name
$username = Read-Host "Enter your GitHub username"
$reponame = Read-Host "Enter your repository name (e.g., smart-trade-backend)"

Write-Host ""
Write-Host "Setting up remote..." -ForegroundColor Yellow

# Remove existing remote if any
git remote remove origin 2>$null

# Add new remote
git remote add origin "https://github.com/$username/$reponame.git"

Write-Host "Remote added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow

# Push to main branch
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "   ✅ Successfully pushed to GitHub!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://dashboard.render.com/" -ForegroundColor White
Write-Host "2. Click 'New +' → 'Web Service'" -ForegroundColor White
Write-Host "3. Connect your GitHub repo: $reponame" -ForegroundColor White
Write-Host "4. Use these settings:" -ForegroundColor White
Write-Host "   - Build Command: pip install -r requirements.txt" -ForegroundColor Gray
Write-Host "   - Start Command: uvicorn app.main:app --host 0.0.0.0 --port `$PORT" -ForegroundColor Gray
Write-Host "5. Add Environment Variables:" -ForegroundColor White
Write-Host "   - SECRET_KEY = (generate)" -ForegroundColor Gray
Write-Host "   - DATABASE_URL = sqlite:///./smarttrade.db" -ForegroundColor Gray
Write-Host "6. Click 'Create Web Service'" -ForegroundColor White
Write-Host ""
Write-Host "Your API will be live in 5-10 minutes! 🚀" -ForegroundColor Green
Write-Host ""
