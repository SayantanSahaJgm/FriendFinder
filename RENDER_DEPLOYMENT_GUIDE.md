# Render Deployment Guide - FriendFinder

## ✅ Build Error Fixed!

The build error `[Error: Failed to collect page data for /api/auth/test]` has been resolved by:
1. Removing the import-time validation in `src/lib/auth.ts`
2. Making the test route dynamic with `export const dynamic = 'force-dynamic'`
3. Loading authOptions at runtime instead of import time

**Status**: Build now completes successfully ✅

---

## 🚀 Deploy to Render

### Step 1: Set Environment Variables

Go to your Render service → **Environment** tab and add these variables:

#### Required Environment Variables

```bash
# Database
MONGODB_URI=mongodb+srv://sahasayantan13jgm_db_user:SAYantan13@cluster0.y3t5eun.mongodb.net/?appName=Cluster0

# NextAuth (Authentication)
NEXTAUTH_SECRET=b4f5c3d9a1e7f6b0c2d4e8f8193a7c5d6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3
NEXTAUTH_URL=https://your-app-name.onrender.com

# Node Environment
NODE_ENV=production
```

**Important**: Replace `your-app-name` in `NEXTAUTH_URL` with your actual Render app name!

#### Optional Environment Variables (for Google OAuth)

```bash
# Google OAuth (optional - only if you want Google Sign-In)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
```

To get Google OAuth credentials, follow the guide in `GOOGLE_OAUTH_SETUP.md`.

---

### Step 2: Deploy

#### Option A: Auto-Deploy (Recommended)

Render should automatically deploy when you push to GitHub. Check your deployment logs.

#### Option B: Manual Deploy

1. Go to your Render dashboard
2. Select your service
3. Click **Manual Deploy** → **Deploy latest commit**

---

### Step 3: Verify Deployment

After deployment completes:

1. **Check Build Logs**
   - Look for: `✓ Generating static pages`
   - Look for: `✓ Finalizing page optimization`
   - Should NOT see: `Build error occurred`

2. **Test Your App**
   - Open: `https://your-app-name.onrender.com`
   - Should see the FriendFinder homepage

3. **Test Login**
   - Go to: `https://your-app-name.onrender.com/login`
   - Try logging in with existing credentials
   - Should redirect to dashboard

4. **Test Registration**
   - Go to: `https://your-app-name.onrender.com/register`
   - Create a new account
   - Should auto-login and redirect to dashboard

---

## 🔍 Troubleshooting

### Build Still Failing?

**Error**: `Failed to collect page data`
- **Solution**: Make sure you pushed the latest code with the build fixes
- Check GitHub to verify commit `850e94d` or later is pushed

**Error**: `[next-auth][error][NO_SECRET]`
- **Solution**: Add `NEXTAUTH_SECRET` to Render environment variables
- Generate a new one: `openssl rand -base64 32`

**Error**: `MongooseServerSelectionError`
- **Solution**: Check `MONGODB_URI` is correctly set
- Verify your MongoDB cluster allows connections from all IPs (0.0.0.0/0)

### App Loads But Login Doesn't Work?

**Check these**:
1. `NEXTAUTH_URL` matches your Render URL exactly
2. `NEXTAUTH_SECRET` is set (not empty)
3. `MONGODB_URI` is correct and database is accessible

**Test MongoDB Connection**:
1. Go to MongoDB Atlas
2. Check **Network Access** → Should allow `0.0.0.0/0` (all IPs)
3. Check **Database Access** → User has read/write permissions

### Logs Show "Cannot connect to database"?

**Fix**:
1. Go to MongoDB Atlas → Network Access
2. Click **Add IP Address**
3. Select **Allow Access from Anywhere** (0.0.0.0/0)
4. Click **Confirm**
5. Wait 1-2 minutes for changes to propagate
6. Redeploy on Render

---

## 🔒 Security Recommendations

### For Production, Generate New Secrets

Don't use the development secrets in production:

```bash
# Generate a new NEXTAUTH_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Then update the `NEXTAUTH_SECRET` in Render environment variables.

### MongoDB Security

1. **Use a strong password** for your database user
2. **Whitelist only necessary IPs** (or use 0.0.0.0/0 for Render's dynamic IPs)
3. **Limit user permissions** to read/write only the necessary database
4. **Enable MongoDB encryption** in Atlas (enabled by default)

### Environment Variables

- ✅ All secrets stored in Render environment (not in code)
- ✅ `.env.local` is gitignored (never commit it)
- ✅ Different secrets for dev and production
- ✅ Rotate secrets every 3-6 months

---

## 📊 Expected Build Output

Your build should look like this:

```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (63/63)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                                 Size     First Load JS
┌ ○ /                                     3.9 kB         130 kB
├ ○ /_not-found                           1 kB           103 kB
├ ƒ /api/auth/[...nextauth]              264 B          102 kB
├ ƒ /api/auth/test                       264 B          102 kB
...
└ ○ /register                            2.66 kB         153 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**Key indicators**:
- ✅ `✓ Generating static pages` (not errors)
- ✅ All API routes show `ƒ (Dynamic)`
- ✅ No "Build error occurred" messages
- ✅ Build completes with optimization step

---

## 🎯 Post-Deployment Checklist

After successful deployment:

- [ ] App loads at `https://your-app-name.onrender.com`
- [ ] Login page accessible and styled correctly
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Dashboard loads after login
- [ ] MongoDB connection working (check Render logs)
- [ ] No console errors in browser (F12 → Console)

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **NextAuth Docs**: https://next-auth.js.org
- **MongoDB Atlas Docs**: https://www.mongodb.com/docs/atlas/
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

## 🔄 Continuous Deployment

Once set up, your app will auto-deploy on every push to GitHub:

1. Make changes locally
2. Commit: `git commit -m "your message"`
3. Push: `git push origin main`
4. Render automatically detects and deploys
5. Check deployment logs in Render dashboard

---

**Last Updated**: November 2, 2025
**Status**: ✅ Ready for deployment!
