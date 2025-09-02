# 🚨 URGENT: Fix Google Sign-In Error - Firebase Console Setup

## ❌ Current Error
**"Google Sign-In failed. Please try again."**

## 🎯 Root Cause
The Google Sign-In provider is **NOT ENABLED** in Firebase Console. This is a **REQUIRED MANUAL STEP**.

## ✅ IMMEDIATE FIX - Step by Step

### Step 1: Access Firebase Console
1. **Open**: https://console.firebase.google.com
2. **Login** with your Google account
3. **Select project**: `campus-resources-demo`

### Step 2: Enable Google Authentication Provider
1. **Click**: "Authentication" in left sidebar
2. **Click**: "Sign-in method" tab (NOT Settings)
3. **Find**: "Google" in the providers list
4. **Click**: on "Google" (it will show as "Disabled")
5. **Toggle**: the "Enable" switch to **ON**
6. **Fill in**:
   - Project support email: Enter your email address
   - Web SDK configuration: Should auto-populate
7. **Click**: "Save"

### Step 3: Add Authorized Domain
1. **Click**: "Settings" tab (next to Sign-in method)
2. **Scroll down**: to "Authorized domains"
3. **Click**: "Add domain"
4. **Enter**: `channasilva.github.io`
5. **Click**: "Add"

### Step 4: Verify Configuration
After completing steps 1-3, you should see:
- ✅ Google provider shows "Enabled" (not "Disabled")
- ✅ `channasilva.github.io` in authorized domains list
- ✅ Web SDK configuration is present

## 🧪 Test the Fix

1. **Wait 2-3 minutes** for Firebase changes to propagate
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Visit**: https://channasilva.github.io/Campus_Resourses_management_System/
4. **Click**: Google Sign-In button
5. **Expected**: Google popup should open (no error message)

## 📋 Visual Guide

### What You Should See in Firebase Console:

**Before Fix**:
```
Google: [Disabled] ❌
```

**After Fix**:
```
Google: [Enabled] ✅
Project support email: your-email@gmail.com
Web SDK configuration: [Present]
```

**Authorized Domains**:
```
✅ localhost (default)
✅ channasilva.github.io (you need to add this)
✅ campus-resources-demo.web.app (default)
```

## 🆘 If You Can't Access Firebase Console

If you don't have access to the Firebase Console:
1. **Check**: Are you the project owner?
2. **Alternative**: Create a new Firebase project
3. **Update**: Firebase config in `src/config/firebase.ts`

## 🔍 Troubleshooting

### Common Issues:
- **"Can't find project"**: Make sure you're logged in with the correct Google account
- **"No permission"**: You need to be project owner or have admin access
- **"Still getting error"**: Wait 5-10 minutes after making changes, then clear browser cache

### Error Messages After Fix:
- ✅ **"This Google account is not registered"**: Normal - means Google auth is working
- ❌ **"Google Sign-In failed"**: Firebase config still not complete

## 🚀 Expected Success Flow

1. **Click Google button** → Google popup opens
2. **Select account** → Authentication proceeds
3. **If email registered** → Login success
4. **If email not registered** → "Account not registered" message

---

## 🎯 CRITICAL ACTION REQUIRED

**YOU MUST COMPLETE THE FIREBASE CONSOLE SETUP ABOVE**

The code is working correctly - the error is because Google authentication is disabled in Firebase Console.

**Time to fix**: 2-3 minutes
**Difficulty**: Easy (just clicking buttons in Firebase Console)