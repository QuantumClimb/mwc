@echo off
echo Stopping Python HTTP server...
echo.

REM Find and kill Python processes running on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    echo Stopping process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Server stopped.
echo.
pause 