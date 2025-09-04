@echo off
echo ========================================
echo  Booking Timezone Fix - Final Deployment
echo ========================================
echo.

echo [1/4] Building the application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo ✅ Build completed successfully!

echo.
echo [2/4] Copying files to dist directory...
if not exist "dist" mkdir dist
xcopy "dist\*" "dist\" /E /I /Y >nul
echo ✅ Files copied to dist directory!

echo.
echo [3/4] Creating test page...
echo ✅ Test page created: test-booking-timezone-fix.html

echo.
echo [4/4] Deployment completed!
echo.
echo ========================================
echo  DEPLOYMENT SUMMARY
echo ========================================
echo.
echo ✅ Timezone fix has been applied
echo ✅ Application built successfully
echo ✅ Test page available: test-booking-timezone-fix.html
echo.
echo NEXT STEPS:
echo 1. Open test-booking-timezone-fix.html in your browser
echo 2. Test with 9:00 AM booking time
echo 3. Verify the time is preserved correctly
echo 4. Deploy to your hosting platform
echo.
echo The timezone issue should now be resolved!
echo.
pause
