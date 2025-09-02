# 🔥 Firebase Google Sign-In Fix - Complete Setup Guide

## 🚨 URGENT: Current Issues Identified

Based on the error "Google Sign-In failed. Please try again." shown in the screenshot, here are the **CRITICAL STEPS** to fix this:

## ✅ STEP 1: Enable Google Provider in Firebase Console

### 🎯 **MOST IMPORTANT**: Enable Google Authentication
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **campus-resources-demo**
3. Navigate to **Authentication** → **Sign-in method** (NOT Settings)
4. Find **Google** in the providers list
5. Click on **Google** (it will show as "Disabled")
6. **Toggle the Enable switch to ON**
7. Fill in required fields:
   - **Project support email**: Enter your email address
   - **Web SDK configuration**: Should auto-populate
8. Click **Save**

## ✅ STEP 2: Add Authorized Domains

### 🌐 Add GitHub Pages Domain
1. Still in Firebase Console: **Authentication** → **Settings** → **Authorized domains**
2. Click **"Add domain"**
3. Enter: `channasilva.github.io`
4. Click **"Add"**
5. **ALSO ADD**: `localhost` (for local testing)

### 📋 Your authorized domains should include:
- ✅ `localhost` (for development)
- ✅ `channasilva.github.io` (for GitHub Pages)
- ✅ `campus-resources-demo.web.app` (Firebase Hosting - if used)

## ✅ STEP 3: Verify Firebase Project Configuration

### 🔍 Double-check these settings:
1. **Project ID**: `campus-resources-demo`
2. **API Key**: `AIzaSyDa63IAknYHAx_zUbxtCXXaxYnh8ExZ9fY`
3. **Auth Domain**: `campus-resources-demo.firebaseapp.com`

## ✅ STEP 4: Test the Fix

### 🧪 Testing Procedure:
1. **Wait 5-10 minutes** after making Firebase changes
2. **Clear browser cache** completely (Ctrl+Shift+Delete)
3. **Disable ad blockers** temporarily
4. **Allow popups** for `channasilva.github.io`
5. Visit: https://channasilva.github.io/Campus_Resourses_management_System/
6. Click **Google Sign-In button**

### 🎯 Expected Results:
- ✅ **Before Fix**: "Google Sign-In failed. Please try again."
- ✅ **After Fix**: Google popup opens for account selection
- ✅ **If email not registered**: "This Google account is not registered in our system"
- ✅ **If email registered**: Successful login to dashboard

## 🔧 STEP 5: Create Test User (If Needed)

If you need to test with a registered user:

1. **Register a user first** using email/password
2. **Then try Google Sign-In** with the same email address
3. **It should work** if the email matches

## 🚨 Common Error Messages and Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Google Sign-In is not enabled" | Google provider disabled | Enable Google provider in Firebase Console |
| "This domain is not authorized" | Domain not in authorized list | Add `channasilva.github.io` to authorized domains |
| "Pop-up was blocked" | Browser blocking popups | Allow popups for the domain |
| "This Google account is not registered" | Email not in system | Register with email/password first |

## 🛠️ Advanced Troubleshooting

### If Still Not Working:

#### Option 1: Check Browser Console
1. Press **F12** to open developer tools
2. Go to **Console** tab
3. Click Google Sign-In button
4. Look for specific error codes like:
   - `auth/unauthorized-domain`
   - `auth/operation-not-allowed`
   - `auth/popup-blocked`

#### Option 2: Test Locally First
```bash
# Test locally to isolate the issue
npm install
npm run dev
# Visit: http://localhost:3000
# Test Google Sign-In
```

#### Option 3: Verify Firebase Project
```bash
# Check if you're using the correct project
firebase projects:list
firebase use campus-resources-demo
```

## 📞 Support Checklist

Before asking for help, verify:
- [ ] Google provider is **ENABLED** in Firebase Console
- [ ] `channasilva.github.io` is in **authorized domains**
- [ ] Waited **10+ minutes** after Firebase changes
- [ ] **Cleared browser cache** completely
- [ ] **Disabled ad blockers** temporarily
- [ ] **Allowed popups** for the domain
- [ ] Tested in **incognito/private mode**

## 🎯 Quick Verification

To verify the fix worked:
1. **No error message** should appear immediately
2. **Google popup** should open
3. **Account selection** should be available
4. **Console logs** should show authentication progress

---

## 🚀 Next Steps After Fix

Once Google Sign-In is working:
1. Test with multiple Google accounts
2. Verify user profile updates correctly
3. Test logout functionality
4. Update documentation

**🔥 CRITICAL**: The Google provider MUST be enabled in Firebase Console first - this is the #1 cause of the error!