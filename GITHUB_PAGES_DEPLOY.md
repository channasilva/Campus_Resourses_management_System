# 🚀 Deploy to GitHub Pages

## ✅ Your app is configured for GitHub Pages!

### 📋 What's Been Set Up:
1. ✅ `gh-pages` package installed
2. ✅ Deployment scripts added to `package.json`
3. ✅ GitHub Actions workflow created (`.github/workflows/deploy.yml`)
4. ✅ Vite config updated for subdirectory deployment
5. ✅ Base path set to `/Campus_Resourses_management_System/`

## 🚀 Deploy Now!

### Option 1: Manual Deployment (Quick)
```bash
npm run deploy
```

### Option 2: Automatic Deployment via GitHub Actions
1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for GitHub Pages deployment"
   git push origin main
   ```

2. **GitHub Actions will automatically:**
   - Build your app
   - Deploy to GitHub Pages
   - Give you a live URL

## 🌐 Your GitHub Pages URL

Once deployed, your app will be available at:
```
https://channasilva.github.io/Campus_Resourses_management_System/
```

## 📱 What Your Friends Get

- **Access from ANY device** (phone, tablet, laptop)
- **No installation required** - it's a web app!
- **Full functionality** - booking, resources, notifications
- **Real-time updates** via Firebase
- **Responsive design** for all screen sizes

## 🔧 Important Steps

### 1. Enable GitHub Pages in Repository Settings
1. Go to your repository: [https://github.com/channasilva/Campus_Resourses_management_System](https://github.com/channasilva/Campus_Resourses_management_System)
2. Click **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **GitHub Actions**
5. Click **Save**

### 2. Update Firebase Authorized Domains
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `campus-resources-demo`
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add: `channasilva.github.io`
5. Click **Add**

### 3. Deploy Your App
```bash
npm run deploy
```

## 🎯 Quick Commands

```bash
# Build and deploy to GitHub Pages
npm run deploy

# Test locally first
npm run preview

# Check deployment status
git status
```

## 🆘 Troubleshooting

### If deployment fails:
1. Check GitHub Actions tab for error logs
2. Verify all files are committed and pushed
3. Make sure GitHub Pages is enabled in repository settings
4. Check Firebase domain authorization

### If app doesn't load:
1. Verify the base path in `vite.config.ts`
2. Check browser console for errors
3. Ensure Firebase domain is authorized

## 🎉 Success!

Once deployed, you'll have:
- ✅ Live web app accessible worldwide
- ✅ Automatic updates on every push
- ✅ Professional hosting via GitHub
- ✅ Shareable URL for your friends

---

## 🚀 Ready to Deploy?

Run this command to deploy your app:
```bash
npm run deploy
```

Your app will be live at: **https://channasilva.github.io/Campus_Resourses_management_System/** 