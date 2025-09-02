@echo off
echo 🚀 Deploying Google Sign-In Fix to GitHub Pages...
echo.

echo ✅ Step 1: Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo ✅ Step 2: Deploying to GitHub Pages...
call npm run deploy
if %errorlevel% neq 0 (
    echo ❌ Deploy failed!
    pause
    exit /b 1
)

echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📋 Next Steps:
echo 1. Configure Firebase Console (see FIREBASE_GOOGLE_SIGNIN_FIX.md)
echo 2. Test at: https://channasilva.github.io/Campus_Resourses_management_System/
echo 3. Verify Google Sign-In functionality
echo.
pause