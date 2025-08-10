@echo off
echo 🚀 Campus Resources Management System - Deployment Script
echo ========================================================

echo.
echo 📦 Building the application...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed! Please check the errors above.
    pause
    exit /b 1
)

echo.
echo ✅ Build successful! 
echo.
echo 🌐 Your app is ready to deploy! Here are your options:
echo.
echo 1️⃣ Vercel (Recommended - Free):
echo    - Go to https://vercel.com
echo    - Sign up/Login with GitHub
echo    - Click "New Project"
echo    - Import your GitHub repository
echo    - Click "Deploy"
echo.
echo 2️⃣ Netlify (Free):
echo    - Go to https://netlify.com
echo    - Sign up/Login
echo    - Drag and drop the 'dist' folder to deploy
echo.
echo 3️⃣ GitHub Pages:
echo    - Install gh-pages: npm install --save-dev gh-pages
echo    - Run: npm run deploy
echo.
echo 📁 Your built files are in the 'dist' folder
echo 🔗 Share the deployment URL with your friends!
echo.
pause 