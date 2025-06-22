@echo off
echo Starting Warehouse Management System...
echo.
echo Backend API will run on: http://localhost:5000
echo Frontend App will be served from: http://localhost:5000
echo.
echo Installing dependencies...
call npm install
echo.
echo Building frontend...
call npm run build
echo.
echo Starting server...
start /B npm run server
echo.
echo Waiting for server to start...
timeout /t 5 /nobreak >nul
echo.
echo Opening application in browser...
start http://localhost:5000
echo.
echo Application started successfully!
echo The application is running at: http://localhost:5000
echo Press Ctrl+C to stop the server.
pause