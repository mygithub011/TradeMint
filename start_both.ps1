# Start TradeMint Backend and Frontend Servers

Write-Host "Starting TradeMint Servers..." -ForegroundColor Cyan
Write-Host ""

# Start Backend in new window
Write-Host "Starting Backend Server on http://127.0.0.1:8000..." -ForegroundColor Green
$backendCmd = "cd '$PSScriptRoot'; Write-Host 'Backend Server Starting...' -ForegroundColor Yellow; uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# Wait a bit for backend to start
Start-Sleep -Seconds 2

# Start Frontend in new window  
Write-Host "Starting Frontend Server on http://localhost:5173..." -ForegroundColor Green
$frontendCmd = "cd '$PSScriptRoot\frontend'; Write-Host 'Frontend Server Starting...' -ForegroundColor Yellow; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "Both servers are starting in new windows!" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend API: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Test Accounts:" -ForegroundColor Cyan
Write-Host "   Admin: admin@smarttrade.com / admin123" -ForegroundColor White
Write-Host "   Trader: trader@example.com / trader123" -ForegroundColor White
Write-Host "   Client: client@example.com / client123" -ForegroundColor White
Write-Host ""
