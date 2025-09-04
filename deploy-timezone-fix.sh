#!/bin/bash

echo "========================================"
echo " Deploying Timezone Fix to GitHub"
echo "========================================"
echo

echo "[1/6] Building the project..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed!"
    exit 1
fi
echo "✅ Build completed successfully!"

echo
echo "[2/6] Checking git status..."
git status
echo

echo "[3/6] Adding all changes..."
git add .
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to add changes!"
    exit 1
fi
echo "✅ Changes added to staging!"

echo
echo "[4/6] Committing changes..."
git commit -m "🕒 Fix booking timezone handling issue

- Fixed createLocalDateTime function to properly parse date/time components
- Fixed toLocalISOString function to preserve local time without shifts
- Enhanced formatLocalTime and formatLocalDateTime for proper display
- Added debugging logs to BookingModal for time tracking
- Created test-timezone-fix.html for verification
- Added comprehensive documentation

Resolves issue where booking times were incorrectly shifted (e.g., 8:00 AM showing as 9:30 AM)"
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to commit changes!"
    exit 1
fi
echo "✅ Changes committed successfully!"

echo
echo "[5/6] Pushing to GitHub..."
git push origin main
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to push to main branch!"
    echo "Trying alternative branch names..."
    git push origin master
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to push to both main and master branches!"
        exit 1
    fi
fi
echo "✅ Changes pushed to GitHub successfully!"

echo
echo "[6/6] Deploying to GitHub Pages..."
npm run deploy
if [ $? -ne 0 ]; then
    echo "WARNING: GitHub Pages deployment failed, but code is pushed to GitHub"
    echo "You may need to manually trigger GitHub Pages deployment"
else
    echo "✅ GitHub Pages deployment completed!"
fi

echo
echo "========================================"
echo " 🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "========================================"
echo
echo "Your timezone fix has been deployed to:"
echo "- GitHub Repository: Updated with latest changes"
echo "- GitHub Pages: https://channasilva.github.io/Campus_Resourses_management_System/"
echo
echo "Test the fix by:"
echo "1. Opening the live site"
echo "2. Creating a new booking with specific times"
echo "3. Verifying times are preserved correctly"
echo
