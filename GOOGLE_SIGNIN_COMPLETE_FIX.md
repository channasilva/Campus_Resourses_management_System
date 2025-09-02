# Complete Google Sign-In Fix Guide

## Issue Summary
Google Sign-In is failing with "Google Sign-In failed. Please try again." error. The issue is primarily due to Firebase authorized domains configuration not matching your deployment URLs.

## Root Cause Analysis
1. **Domain Authorization Issue**: Firebase Console authorized domains don't include your GitHub Pages domain
2. **Popup Blocking**: Browser may be blocking the Google Sign-In popup
3. **Configuration Mismatch**: Local development vs production domain differences

## IMMEDIATE SOLUTION STEPS

### Step 1: Fix Firebase Console (CRITICAL - DO THIS FIRST)

1. **Go to Firebase Console**:
   ```
   https://console.firebase.google.com/project/campus-resources-demo/authentication/providers
   ```

2. **Click on Google Provider** (should show "Enabled")

3. **Scroll to "Authorized domains" section** and ensure these domains are present:
   ```
   localhost
   campus-resources-demo.firebaseapp.com
   campus-resources-demo.web.app
   channasilva.github.io
   ```

4. **If `channasilva.github.io` is missing, ADD IT**:
   - Click "Add domain"
   - Enter: `channasilva.github.io`
   - Click "Save"

### Step 2: Test Local Development First

1. **Open your local development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to**: `http://localhost:3000/Campus_Resourses_management_System/login`

3. **Try Google Sign-In**:
   - Click the Google button
   - If popup is blocked, allow popups for localhost
   - Check browser console for any errors

### Step 3: Deploy and Test Production

1. **Build and deploy**:
   ```bash
   npm run build
   npm run deploy
   ```

2. **Test on GitHub Pages**:
   ```
   https://channasilva.github.io/Campus_Resourses_management_System/login
   ```

## Troubleshooting Guide

### If Google Sign-In Still Fails:

#### Check 1: Browser Console Errors
Look for these specific errors:
- `auth/unauthorized-domain` → Domain not authorized in Firebase
- `auth/popup-blocked` → Browser blocking popup
- `auth/operation-not-allowed` → Google provider not enabled

#### Check 2: Popup Blocker
- Disable popup blocker for your domain
- Try in incognito/private mode
- Check if popup appears behind main window

#### Check 3: Firebase Project Settings
Verify in Firebase Console:
- Project ID: `campus-resources-demo`
- Google provider is enabled
- Web app configuration matches your code

#### Check 4: Network Issues
- Check internet connection
- Try different browser
- Clear browser cache and cookies

## Expected Behavior After Fix

### Local Development (localhost:3000):
1. Click Google button → Popup opens
2. Select Google account → Popup closes
3. Either success (redirect to dashboard) OR error message about account not registered

### Production (GitHub Pages):
1. Same behavior as local development
2. Should work seamlessly once domain is authorized

## Additional Debugging

### Enable Detailed Logging
The code already includes detailed console logging. Check browser console for:
```
🚀 Starting Google Sign-In process...
🌐 Current URL: [current URL]
🔧 Google provider configured with scopes and parameters
🔐 Attempting Google Sign-In popup...
```

### Test with Different Accounts
Try Google Sign-In with:
1. Account that's registered in your system
2. Account that's NOT registered (should show specific error)

## Firebase Console Screenshots Reference
Based on your screenshots, you need to verify:
1. Google provider shows "Enabled" status
2. "Authorized domains" section includes `channasilva.github.io`
3. No other configuration conflicts

## Quick Verification Checklist

- [ ] Firebase Console → Authentication → Providers → Google → Enabled ✓
- [ ] Authorized domains includes `channasilva.github.io`
- [ ] Local development works (localhost:3000)
- [ ] Production deployment updated
- [ ] Browser popup blocker disabled
- [ ] Console shows detailed logging

## If All Else Fails

### Alternative Approach - Redirect Instead of Popup
If popup continues to fail, we can modify the code to use redirect instead:

```javascript
// Instead of signInWithPopup, use signInWithRedirect
import { signInWithRedirect, getRedirectResult } from 'firebase/auth';
```

This would require code changes but is more reliable across different browsers and environments.

## Contact Support
If the issue persists after following all steps:
1. Provide browser console logs
2. Confirm Firebase Console settings
3. Test on different browsers/devices
4. Check if issue is specific to certain Google accounts