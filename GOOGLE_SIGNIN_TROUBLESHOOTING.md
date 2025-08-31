# 🔧 Google Sign-In Troubleshooting Guide

## 🚨 Current Error: "Google Sign-In failed. Please try again."

### 📋 Quick Fix Checklist

#### ✅ Step 1: Add GitHub Pages Domain to Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **campus-resources-demo**
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Enter: `channasilva.github.io`
6. Click **"Add"**
7. **Wait 5-10 minutes** for changes to propagate

#### ✅ Step 2: Verify Google Provider is Enabled
1. In Firebase Console: **Authentication** → **Sign-in method**
2. Find **Google** provider
3. Ensure it's **Enabled** (toggle should be ON)
4. Click **Google** to open settings
5. Verify **Web SDK configuration** is present

#### ✅ Step 3: Check Browser Settings
1. **Allow popups** for `channasilva.github.io`
2. **Clear browser cache** and cookies
3. **Disable ad blockers** temporarily
4. Try in **incognito/private mode**

## 🔍 Detailed Error Analysis

### Common Error Codes and Solutions:

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/unauthorized-domain` | Domain not authorized | Add domain to Firebase Console |
| `auth/popup-blocked` | Browser blocked popup | Allow popups for the domain |
| `auth/popup-closed-by-user` | User closed popup | User action - try again |
| `auth/operation-not-allowed` | Google Sign-In disabled | Enable in Firebase Console |
| `auth/network-request-failed` | Network issue | Check internet connection |

## 🛠️ Step-by-Step Firebase Configuration

### 1. Firebase Console Access
```
URL: https://console.firebase.google.com
Project: campus-resources-demo
```

### 2. Authentication Setup
```
Navigation: Authentication → Settings → Authorized domains
Action: Add "channasilva.github.io"
```

### 3. Google Provider Configuration
```
Navigation: Authentication → Sign-in method → Google
Status: Must be "Enabled"
Web SDK: Must have valid configuration
```

## 🧪 Testing Steps

### After Firebase Configuration:
1. **Wait 10 minutes** for Firebase changes to propagate
2. **Clear browser cache** completely
3. **Visit**: https://channasilva.github.io/Campus_Resourses_management_System/
4. **Open browser console** (F12) to see detailed errors
5. **Click Google Sign-In button**
6. **Check console logs** for specific error codes

### Expected Success Flow:
1. Click Google button → Popup opens
2. Select Google account → Authentication
3. Popup closes → Redirect to dashboard
4. No error messages in console

## 🔧 Advanced Troubleshooting

### If Still Not Working:

#### Option 1: Check Firebase Project Settings
```bash
# Verify project configuration
firebase projects:list
firebase use campus-resources-demo
```

#### Option 2: Alternative Domain Testing
Try accessing via Firebase Hosting instead:
```bash
# Deploy to Firebase Hosting
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

#### Option 3: Local Testing
Test locally first to isolate the issue:
```bash
# Run locally
npm run dev
# Visit: http://localhost:3001
# Test Google Sign-In
```

## 📞 Support Information

### If You Need Help:
1. **Check browser console** for exact error codes
2. **Screenshot the Firebase Console** authorized domains section
3. **Verify project ID** matches: `campus-resources-demo`
4. **Wait full 30 minutes** after making Firebase changes

### Debug Information to Collect:
- Browser console error messages
- Firebase project ID
- Current authorized domains list
- Browser and version
- Network connectivity status

## ✅ Success Indicators

When working correctly:
- ✅ No console errors
- ✅ Google popup opens smoothly
- ✅ User can select account
- ✅ Successful redirect to dashboard
- ✅ User profile loads correctly

---

**🎯 Next Action**: Add `channasilva.github.io` to Firebase Console authorized domains and wait 10 minutes.