@echo off
echo Starting 3D Model Expo Viewer...
echo.
echo Starting Python HTTP server on port 8000...
echo.
echo Server will be available at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the Python HTTP server in the background
start /B python server.py

REM Wait a moment for the server to start
timeout /t 2 /nobreak >nul

REM Open the default browser to the page
start http://localhost:8000

echo.
echo Browser should open automatically to the 3D Model Expo Viewer
echo.
echo To stop the server, close this window or press Ctrl+C
echo.

REM Keep the batch file running so the server stays active
pause 