# 🚨 FIX: Registration Permission Error

## ❌ **Current Problem:**
**"Registration failed: Missing or insufficient permissions"**

This error occurs because the Firestore security rules are preventing new users from creating their profile documents during registration.

## ✅ **SOLUTION: Update Firestore Security Rules**

### **Step 1: Go to Firebase Console**
1. **Open:** https://console.firebase.google.com
2. **Login** with your Google account
3. **Select project:** `campus-resources-demo`

### **Step 2: Navigate to Firestore Rules**
1. **Click:** "Firestore Database" in the left sidebar
2. **Click:** "Rules" tab
3. **You'll see the current rules** (which are causing the issue)

### **Step 3: Replace the Rules**
**Delete all existing rules** and **paste this new code:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to create their own profile during registration
    // and read/write their own data after authentication
    match /users/{userId} {
      allow create: if request.auth != null && request.auth.uid == userId;
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read all users (for admin purposes)
    match /users/{document=**} {
      allow read: if request.auth != null;
    }
    
    // Allow authenticated users to read/write resources
    match /resources/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write bookings
    match /bookings/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write notifications
    match /notifications/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write maintenance records
    match /maintenance/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write audit logs
    match /audit_logs/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write system settings
    match /system/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### **Step 4: Publish the Rules**
1. **Click:** "Publish" button
2. **Wait:** 1-2 minutes for rules to take effect
3. **You should see:** "Rules published successfully"

## 🎯 **What This Fix Does:**

### **Before (Broken):**
```javascript
// This rule was too restrictive
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### **After (Fixed):**
```javascript
// This allows creation during registration
match /users/{userId} {
  allow create: if request.auth != null && request.auth.uid == userId;
  allow read, update, delete: if request.auth != null && request.auth.uid == userId;
}
```

## 🧪 **Test the Fix:**

### **Step 1: Clear Browser Cache**
1. **Press:** `Ctrl + Shift + Delete`
2. **Select:** "All time"
3. **Click:** "Clear data"

### **Step 2: Try Registration Again**
1. **Go to:** https://channasilva.github.io/Campus_Resourses_management_System/register
2. **Fill out the form** with new details:
   - **Username:** testuser2
   - **Email:** testuser2@example.com
   - **Password:** password123
   - **Role:** Student
   - **Department:** Computer Science
3. **Click:** "Create Account"

### **Step 3: Expected Result**
- ✅ **Success message:** "Account created successfully!"
- ✅ **Redirect to:** Dashboard
- ✅ **No permission errors**

## 🔍 **If You Still Get Errors:**

### **Check Browser Console:**
1. **Press:** `F12` to open Developer Tools
2. **Click:** "Console" tab
3. **Look for:** Firebase error messages
4. **Share the error** if registration still fails

### **Verify Rules Are Applied:**
1. **Go back to:** Firebase Console → Firestore → Rules
2. **Check:** Rules show the new code
3. **Status:** Should show "Published"

## 📋 **Alternative: Temporary Open Rules (NOT RECOMMENDED FOR PRODUCTION)**

If you need to test quickly, you can temporarily use these open rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ WARNING:** These rules allow anyone to read/write your database. Only use for testing and change back to secure rules immediately.

## ✅ **After Fixing:**

1. **Registration should work** without permission errors
2. **Users can create accounts** successfully
3. **Login functionality** remains secure
4. **Data is protected** with proper authentication

---

**Need Help?** If you're still having issues, check the browser console for specific error messages and share them for further assistance.
