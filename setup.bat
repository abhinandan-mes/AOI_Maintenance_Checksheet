@echo off
REM AOI CheckPoint Quick Start Script for Windows

echo 🚀 AOI CheckPoint - Quick Start Setup
echo =====================================

REM Check if Node.js is installed
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install it first.
    pause
    exit /b 1
)

echo ✓ Node.js found:
node -v

echo ✓ npm found:
npm -v

echo.
echo 📦 Installing Backend Dependencies...
cd server
call npm install
echo ✓ Backend dependencies installed

echo.
echo 📦 Installing Frontend Dependencies...
cd ..\client
call npm install
echo ✓ Frontend dependencies installed

echo.
echo ✅ Setup Complete!
echo.
echo 📝 Next Steps:
echo 1. Update database credentials in server/.env
echo 2. Ensure PostgreSQL is running
echo 3. Run: npm run dev (from server directory)
echo 4. Run: npm start (from client directory)
echo.
echo 🌐 Frontend: http://localhost:3010
echo 🔧 Backend:  http://localhost:5010
echo.
pause
