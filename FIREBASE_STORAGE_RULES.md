# Firebase Storage Security Rules Setup

## 🔧 **Fix CORS Errors for Image Uploads**

The CORS errors you're seeing are because Firebase Storage security rules are blocking uploads from `localhost:3000`. Follow these steps to fix this:

### **Step 1: Go to Firebase Console**
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `campus-resources-demo`
3. Click on **"Storage"** in the left sidebar

### **Step 2: Update Security Rules**
1. Click on the **"Rules"** tab
2. Replace the existing rules with these:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to all files
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Allow write access for notification images
    match /notification-images/{allPaths=**} {
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024 // 5MB limit
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Allow write access for profile pictures
    match /profile-pictures/{allPaths=**} {
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024 // 5MB limit
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Allow write access for resource images
    match /resource-images/{allPaths=**} {
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024 // 5MB limit
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### **Step 3: Publish Rules**
1. Click **"Publish"** to save the rules
2. Wait for the rules to be deployed (usually takes a few seconds)

### **Step 4: Test the Fix**
1. Go back to your application
2. Try creating a notification with an image again
3. The CORS errors should be resolved

## 🛡️ **Security Rules Explanation**

- **`allow read: if true`**: Anyone can read images (for displaying notifications)
- **`allow write: if request.auth != null`**: Only authenticated users can upload
- **`request.resource.size < 5 * 1024 * 1024`**: 5MB file size limit
- **`request.resource.contentType.matches('image/.*')`**: Only image files allowed

## 🔄 **Alternative: Disable CORS for Development**

If you still get CORS errors, you can temporarily disable CORS for development:

1. In Firebase Console → Storage → Rules
2. Use these more permissive rules (ONLY for development):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Warning**: The permissive rules above allow anyone to upload files. Only use for development and switch back to secure rules for production.

## 🚀 **After Fixing Rules**

Once the rules are updated, your notification system should work perfectly:
- ✅ Image uploads will work
- ✅ Notifications will be created successfully
- ✅ All users will see the notifications with images
- ✅ No more CORS errors 