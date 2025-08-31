# 🔥 Firebase Google Provider Setup - URGENT FIX

## ❌ Current Error
**"Google Sign-In is not enabled. Please contact the administrator."**

## 🎯 Root Cause
The Google Sign-In provider is **NOT ENABLED** in Firebase Console.

## ✅ IMMEDIATE FIX STEPS

### Step 1: Enable Google Provider in Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `campus-resources-demo`
3. **Navigate to Authentication**:
   - Click "Authentication" in the left sidebar
   - Click "Sign-in method" tab (NOT Settings)

4. **Enable Google Provider**:
   - Find "Google" in the list of providers
   - Click on "Google" (it should show as "Disabled")
   - Toggle the **"Enable"** switch to ON
   - You'll see a configuration form

5. **Configure Google Provider**:
   - **Project support email**: Enter your email address
   - **Web SDK configuration**: Should auto-populate
   - Click **"Save"**

### Step 2: Add Authorized Domains (If Not Already Done)

1. **Still in Firebase Console**:
   - Go to Authentication → Settings → Authorized domains
   - Click "Add domain"
   - Enter: `channasilva.github.io`
   - Click "Add"

### Step 3: Verify Configuration

After enabling, you should see:
- ✅ Google provider shows as "Enabled"
- ✅ Web SDK configuration is present
- ✅ Authorized domains include `channasilva.github.io`

## 🧪 Test the Fix

1. **Wait 2-3 minutes** for Firebase changes to propagate
2. **Clear browser cache** completely
3. **Visit**: https://channasilva.github.io/Campus_Resourses_management_System/
4. **Click Google Sign-In button**
5. **Should now open Google popup** instead of showing error

## 📋 Checklist

- [ ] Firebase Console → Authentication → Sign-in method
- [ ] Google provider is **Enabled** (toggle ON)
- [ ] Project support email is set
- [ ] Web SDK configuration is present
- [ ] Authorized domains include `channasilva.github.io`
- [ ] Wait 2-3 minutes for changes
- [ ] Clear browser cache
- [ ] Test Google Sign-In button

## 🆘 If Still Not Working

### Check These:
1. **Correct Firebase Project**: Ensure you're in `campus-resources-demo`
2. **Google Provider Status**: Must show "Enabled" not "Disabled"
3. **Browser Console**: Check for new error messages
4. **Popup Blockers**: Disable for your domain

### Expected Success Flow:
1. Click Google button → **Popup opens** (not error message)
2. Select Google account → Authentication
3. If email not registered → "not registered in our system" error
4. If email registered → Success login

---

## 🚨 CRITICAL: The Google provider MUST be enabled in Firebase Console first!

**Next Action**: Go to Firebase Console and enable the Google Sign-In provider immediately.