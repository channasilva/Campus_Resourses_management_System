# 🔧 Update Firestore Security Rules

## Steps to Fix Firestore Rules:

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `campus-resources-demo`
3. **Click "Firestore Database"** in the left sidebar
4. **Click "Rules"** tab
5. **Replace the existing rules** with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
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

6. **Click "Publish"** to save the rules

## ✅ After Updating Rules:

1. **Try registering a new user** with a different email
2. **Check browser console** for Firebase logs
3. **Use the debug panel** to verify users are stored
4. **Check Firebase Console** → Authentication → Users

The registration should now work with Firebase! 🎉 