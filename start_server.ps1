# Start Smart Trade Backend Server
Write-Host "Starting Smart Trade Backend Server on http://0.0.0.0:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

& "$PSScriptRoot\.venv\Scripts\uvicorn.exe" app.main:app --host 0.0.0.0 --port 8000
