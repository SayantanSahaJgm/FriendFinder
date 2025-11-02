# Render Environment Variables Setup

## 🚨 Critical: This is WHY Your App Fails on Render

The error `[next-auth][error][NO_SECRET]` happens because **Render doesn't have access to your `.env.local` file**. 

Environment variables must be configured separately in the Render dashboard.

---

## ✅ Step-by-Step Guide

### 1. Access Render Dashboard

1. Go to: https://dashboard.render.com/
2. Log in to your account
3. Find and click on your **FriendFinder** service

### 2. Navigate to Environment Variables

1. In your service page, look at the left sidebar
2. Click on **Environment** tab
3. You'll see a list of environment variables (may be empty)

### 3. Add Required Environment Variables

Click **Add Environment Variable** button for each of these:

#### Variable 1: MONGODB_URI
```
Key: MONGODB_URI
Value: mongodb+srv://sahasayantan13jgm_db_user:SAYantan13@cluster0.y3t5eun.mongodb.net/?appName=Cluster0
```

#### Variable 2: NEXTAUTH_SECRET
```
Key: NEXTAUTH_SECRET
Value: b4f5c3d9a1e7f6b0c2d4e8f8193a7c5d6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3
```

#### Variable 3: NEXTAUTH_URL
```
Key: NEXTAUTH_URL
Value: https://YOUR-APP-NAME.onrender.com
```

**IMPORTANT**: Replace `YOUR-APP-NAME` with your actual Render app name!

To find your app name:
- Look at your Render dashboard URL
- It will be like: `https://dashboard.render.com/web/srv-xxx`
- Your public URL is shown at the top of the service page

#### Variable 4: NODE_ENV (Optional but Recommended)
```
Key: NODE_ENV
Value: production
```

### 4. Save Changes

1. After adding all 4 variables, click **Save Changes**
2. Render will show: "Environment updated. Redeploying..."
3. Wait for the deployment to complete (2-5 minutes)

---

## 🔍 How to Verify It's Working

### Check Deployment Logs

1. In Render dashboard, go to **Logs** tab
2. Look for these indicators:

**✅ Good signs:**
```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Generating static pages (63/63)
Server listening on port 10000
```

**❌ Bad signs (means env vars not set):**
```
[next-auth][error][NO_SECRET]
Error [MissingSecretError]: Please define a `secret` in production
```

### Test Your App

Once deployed:

1. **Open your app**: `https://your-app-name.onrender.com`
   - Should load the homepage

2. **Test login**: `https://your-app-name.onrender.com/login`
   - Should show login form
   - Try logging in with credentials
   - Should redirect to dashboard (not show errors)

3. **Check API**: `https://your-app-name.onrender.com/api/health`
   - Should return: `{"status": "ok"}`

---

## 🎯 Quick Checklist

Before clicking "Save Changes", verify you have:

- [ ] `MONGODB_URI` - Set with your MongoDB connection string
- [ ] `NEXTAUTH_SECRET` - Set with the secret key
- [ ] `NEXTAUTH_URL` - Set with your **actual Render URL** (not placeholder!)
- [ ] `NODE_ENV` - Set to `production`

---

## 🔐 Optional: Google OAuth (If You Want Google Sign-In)

If you want to enable Google Sign-In on production:

#### Variable 5: GOOGLE_CLIENT_ID
```
Key: GOOGLE_CLIENT_ID
Value: your-google-client-id.apps.googleusercontent.com
```

#### Variable 6: GOOGLE_CLIENT_SECRET
```
Key: GOOGLE_CLIENT_SECRET
Value: GOCSPX-your-google-client-secret
```

**Note**: You need to:
1. Follow `GOOGLE_OAUTH_SETUP.md` guide
2. Add your Render URL to Google Console authorized redirect URIs:
   - `https://your-app-name.onrender.com/api/auth/callback/google`

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Not Replacing Placeholder URLs
```
NEXTAUTH_URL=https://your-app-name.onrender.com  ❌ WRONG!
```

**Fix**: Replace with actual URL
```
NEXTAUTH_URL=https://friendfinder-abc123.onrender.com  ✅ CORRECT!
```

### ❌ Mistake 2: Extra Spaces in Values

**Wrong**:
```
NEXTAUTH_SECRET= b4f5c3d9...  ❌ (space before value)
```

**Correct**:
```
NEXTAUTH_SECRET=b4f5c3d9...  ✅ (no spaces)
```

### ❌ Mistake 3: Forgetting to Save

After adding variables, **you must click "Save Changes"** for them to take effect!

---

## 🔄 After Adding Variables

### What Happens Next:

1. ✅ Render automatically redeploys your service
2. ✅ New build uses the environment variables
3. ✅ NextAuth can now encrypt JWT tokens
4. ✅ Login should work without errors

### Timeline:
- **Adding variables**: 1-2 minutes
- **Redeployment**: 2-5 minutes
- **Total**: ~5-7 minutes

---

## 🆘 Still Having Issues?

### If Errors Continue After Setting Variables:

1. **Verify Variables Are Set**:
   - Go to Environment tab
   - Check all 4 variables are listed
   - No typos in keys

2. **Check Deployment Logs**:
   - Go to Logs tab
   - Look for the error message
   - If still seeing `NO_SECRET` error, the variable isn't being read

3. **Manual Redeploy**:
   - Go to **Manual Deploy** → **Deploy latest commit**
   - Force a fresh build

4. **Check MongoDB Atlas**:
   - Go to MongoDB Atlas dashboard
   - **Network Access** → Should allow `0.0.0.0/0` (all IPs)
   - **Database Access** → User should have read/write permissions

---

## 📞 Quick Reference

### Your Render App URLs

Find these in your Render dashboard:

- **Dashboard**: `https://dashboard.render.com/`
- **Service Settings**: Click your service → Settings
- **Environment**: Click your service → Environment
- **Logs**: Click your service → Logs
- **Public URL**: Shown at top of service page

### Your Environment Variables Template

Copy this and fill in your actual values:

```bash
MONGODB_URI=mongodb+srv://sahasayantan13jgm_db_user:SAYantan13@cluster0.y3t5eun.mongodb.net/?appName=Cluster0
NEXTAUTH_SECRET=b4f5c3d9a1e7f6b0c2d4e8f8193a7c5d6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3
NEXTAUTH_URL=https://[YOUR-ACTUAL-RENDER-URL].onrender.com
NODE_ENV=production
```

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Build completes without `NO_SECRET` errors
2. ✅ App loads at your Render URL
3. ✅ Login page displays correctly
4. ✅ You can successfully log in
5. ✅ Dashboard loads after login

---

**Last Updated**: November 2, 2025
**Status**: Environment variables required for production deployment
