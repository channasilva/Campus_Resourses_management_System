# 🔐 Admin Account Management

## ✅ **Changes Made:**

1. **Removed "Admin" option** from the public registration form
2. **Only "Student" and "Lecturer"** roles are now available for public registration
3. **Admin accounts must be created manually** through secure methods

## 🛡️ **How to Create Admin Accounts:**

### **Method 1: Firebase Console (Recommended)**
1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `campus-resources-demo`
3. **Click "Authentication"** in the left sidebar
4. **Click "Users"** tab
5. **Click "Add user"**
6. **Enter email and password** for the admin
7. **After creating the user**, go to **Firestore Database**
8. **Find the user document** in the `users` collection
9. **Edit the document** and change `role` to `"admin"`
10. **Save the changes**

### **Method 2: Using the Admin Creation Utility**
```javascript
// In browser console (only for existing admins)
import { createAdminAccount } from './src/utils/admin-creation';

await createAdminAccount({
  username: "admin_user",
  email: "admin@example.com", 
  password: "secure_password",
  department: "IT"
});
```

### **Method 3: Direct Database Update**
1. **Register a user** normally (as student/lecturer)
2. **Go to Firebase Console** → Firestore Database
3. **Find the user** in the `users` collection
4. **Edit the document** and change `role` from `"student"` or `"lecturer"` to `"admin"`
5. **Save the changes**

## 🔍 **How to Verify Admin Access:**

### **Check Current User Role:**
```javascript
// In browser console
const userData = localStorage.getItem('user');
if (userData) {
  const user = JSON.parse(userData);
  console.log('User role:', user.role);
  console.log('Is admin:', user.role === 'admin');
}
```

### **Admin Features Available:**
- ✅ **Full system access**
- ✅ **Can manage all resources**
- ✅ **Can approve/reject bookings**
- ✅ **Can view all user data**
- ✅ **Can create other admin accounts**
- ✅ **System settings management**

## 🚨 **Security Best Practices:**

1. **Limit admin creation** to trusted personnel only
2. **Use strong passwords** for admin accounts
3. **Regularly audit** admin accounts
4. **Monitor admin activities** through audit logs
5. **Consider implementing** additional authentication for admin actions

## 📋 **Admin Account Checklist:**

- [ ] Admin account created in Firebase Authentication
- [ ] User document updated in Firestore with `role: "admin"`
- [ ] Admin can log in successfully
- [ ] Admin has access to all admin features
- [ ] Admin can create/manage resources
- [ ] Admin can approve/reject bookings

## 🔧 **Troubleshooting:**

### **If admin can't access admin features:**
1. **Check user role** in Firestore Database
2. **Verify the role is exactly** `"admin"` (lowercase)
3. **Clear browser cache** and localStorage
4. **Log out and log back in**

### **If you need to create the first admin:**
1. **Use Firebase Console** method (Method 1 above)
2. **Or temporarily enable admin registration** by adding `{ value: 'admin', label: 'Admin' }` back to the registration form
3. **Create the admin account**
4. **Remove admin option** from registration form again

## ✅ **Current Status:**

- ✅ **Public registration** only allows Student/Lecturer roles
- ✅ **Admin accounts** must be created manually
- ✅ **Admin functionality** is preserved and working
- ✅ **Security** is improved by preventing public admin registration 