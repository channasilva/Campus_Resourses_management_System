# 🔥 Firebase Setup for GitHub Pages - Google Sign-In Fix

## ❌ Current Issue
**Error**: "Google Sign-In failed. Please try again."
**Cause**: GitHub Pages domain not authorized in Firebase

## ✅ Solution Steps

### 1. Add GitHub Pages Domain to Firebase

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `campus-resources-demo`
3. **Navigate to Authentication**:
   - Click "Authentication" in left sidebar
   - Click "Settings" tab
   - Click "Authorized domains"

4. **Add GitHub Pages Domain**:
   - Click "Add domain"
   - Enter: `channasilva.github.io`
   - Click "Add"

### 2. Configure Google OAuth for GitHub Pages

1. **In Firebase Console**:
   - Go to Authentication → Sign-in method
   - Click on "Google" provider
   - Make sure it's enabled

2. **Add GitHub Pages URL to OAuth**:
   - In the Google provider settings
   - Under "Authorized domains", ensure `channasilva.github.io` is listed
   - Save changes

### 3. Verify Domain Authorization

After adding the domain, your authorized domains should include:
- `localhost` (for development)
- `channasilva.github.io` (for GitHub Pages)
- `campus-resources-demo.firebaseapp.com` (default Firebase domain)

## 🧪 Test the Fix

1. **Wait 5-10 minutes** for Firebase changes to propagate
2. **Visit your GitHub Pages site**: https://channasilva.github.io/Campus_Resourses_management_System/
3. **Click the Google Sign-In button**
4. **Should now work without errors**

## 🔧 Alternative: Use Firebase Hosting

If GitHub Pages continues to have issues, consider using Firebase Hosting:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy to Firebase Hosting
firebase deploy
```

## 📝 Important Notes

- **Domain Authorization**: Required for any custom domain
- **Propagation Time**: Changes may take 5-10 minutes to take effect
- **HTTPS Required**: Google Sign-In only works over HTTPS (GitHub Pages provides this)
- **Popup Blockers**: Ensure browser allows popups for the domain

## 🆘 Troubleshooting

### If Google Sign-In still fails:

1. **Check Browser Console** for detailed error messages
2. **Verify Domain** is correctly added in Firebase Console
3. **Clear Browser Cache** and try again
4. **Check Popup Blockers** - disable for your domain
5. **Wait Longer** - Firebase changes can take up to 30 minutes

### Common Error Messages:

- `auth/unauthorized-domain` → Domain not authorized in Firebase
- `auth/popup-blocked` → Browser blocking popup
- `auth/popup-closed-by-user` → User closed popup manually

## ✅ Success Indicators

When working correctly, you should see:
- Google Sign-In popup opens
- User can select Google account
- Successful authentication
- Redirect to dashboard
- No error messages

---

**Next Step**: Add the GitHub Pages domain to Firebase Console as described above.