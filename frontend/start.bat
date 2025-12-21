@echo off
echo ====================================
echo   Smart Trade Frontend Launcher
echo ====================================
echo.
echo Starting development server...
echo.
echo Frontend will be available at:
echo http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo ====================================
echo.

cd /d "%~dp0"
npm run dev
