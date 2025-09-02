# Google Sign-In Domain Configuration Fix

## Problem Identified
The Google Sign-In is failing because of domain authorization issues in Firebase Console.

## Root Cause
1. **Missing GitHub Pages Domain**: Your Firebase authorized domains don't include the correct GitHub Pages URL
2. **Domain Mismatch**: The Vite config uses `/Campus_Resourses_management_System/` but Firebase domains need to match exactly

## Required Firebase Console Changes

### Step 1: Add Missing Authorized Domains
Go to Firebase Console → Authentication → Settings → Authorized domains and add:

1. `channasilva.github.io` (if not already present)
2. `localhost` (for local development)
3. `127.0.0.1` (for local development)

### Step 2: Verify Current Domains
Your Firebase console should have these authorized domains:
- ✅ `localhost` (for development)
- ✅ `campus-resources-demo.firebaseapp.com` (Firebase hosting)
- ✅ `campus-resources-demo.web.app` (Firebase hosting)
- ✅ `channasilva.github.io` (GitHub Pages domain)

### Step 3: Check GitHub Pages URL
Your actual GitHub Pages URL should be:
`https://channasilva.github.io/Campus_Resourses_management_System/`

Make sure this domain (`channasilva.github.io`) is in your Firebase authorized domains.

## Immediate Actions Required

### 1. Firebase Console Fix (CRITICAL)
```
1. Go to: https://console.firebase.google.com/project/campus-resources-demo/authentication/providers
2. Click on Google provider
3. Scroll to "Authorized domains" section
4. Add "channasilva.github.io" if not present
5. Save changes
```

### 2. Test Local Development First
Before testing on GitHub Pages, test locally:
```bash
npm run dev
# Then try Google Sign-In at http://localhost:3000
```

### 3. Deploy and Test
```bash
npm run build
npm run deploy
# Then test at: https://channasilva.github.io/Campus_Resourses_management_System/
```

## Additional Debugging Steps

### Check Browser Console
When Google Sign-In fails, check browser console for:
- `auth/unauthorized-domain` errors
- Network request failures
- CORS errors

### Verify Firebase Project
Ensure you're using the correct Firebase project:
- Project ID: `campus-resources-demo`
- Auth Domain: `campus-resources-demo.firebaseapp.com`

## Expected Behavior After Fix
1. Local development: Google Sign-In works at `localhost:3000`
2. Production: Google Sign-In works at `channasilva.github.io/Campus_Resourses_management_System/`
3. Error messages should be more specific if other issues exist

## Troubleshooting
If Google Sign-In still fails after domain fix:
1. Clear browser cache and cookies
2. Try incognito/private browsing mode
3. Check if popup blockers are enabled
4. Verify Google account has necessary permissions

## Next Steps
1. ✅ Update Firebase authorized domains
2. ✅ Test locally first
3. ✅ Deploy and test on GitHub Pages
4. ✅ Monitor browser console for any remaining errors