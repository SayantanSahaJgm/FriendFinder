# Railway Deployment Guide - FriendFinder

## ✅ Build Error Fixed!

The build error has been resolved and your app is now ready for Railway deployment.

---

## 🚀 Deploy to Railway

### Step 1: Connect GitHub Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Choose your repository: `FriendFinder-Vscode`
5. Railway will detect it's a Next.js app automatically

---

### Step 2: Set Environment Variables

After creating the project, click on your service → **Variables** tab.

#### Required Environment Variables

Add these variables one by one:

```bash
# Database
MONGODB_URI=mongodb+srv://sahasayantan13jgm_db_user:SAYantan13@cluster0.y3t5eun.mongodb.net/?appName=Cluster0

# NextAuth (Authentication)
NEXTAUTH_SECRET=b4f5c3d9a1e7f6b0c2d4e8f8193a7c5d6e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Node Environment
NODE_ENV=production
```

**Note**: Railway automatically provides `RAILWAY_PUBLIC_DOMAIN` - you can use it directly in `NEXTAUTH_URL`!

#### Optional Environment Variables (for Google OAuth)

```bash
# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
```

---

### Step 3: Configure Build Settings (Optional)

Railway should auto-detect Next.js settings, but verify:

1. **Build Command**: `npm run build` (auto-detected)
2. **Start Command**: `npm start` (auto-detected)
3. **Install Command**: `npm install` (auto-detected)

These are usually set correctly by default.

---

### Step 4: Deploy

1. Railway will automatically start building and deploying
2. Watch the logs in real-time
3. Look for successful build indicators:
   - `✓ Creating an optimized production build`
   - `✓ Generating static pages`
   - `✓ Finalizing page optimization`

---

### Step 5: Get Your App URL

1. Go to **Settings** tab
2. Under **Domains**, you'll see your Railway domain
3. It will look like: `friendfinder-production-xxxx.up.railway.app`
4. Click to open your app!

#### Optional: Add Custom Domain

1. In **Settings** → **Domains**
2. Click **Add Custom Domain**
3. Enter your domain (e.g., `friendfinder.com`)
4. Follow DNS configuration instructions
5. Railway will provide SSL certificate automatically

---

## 🔍 Verify Deployment

### Test Your App

1. **Homepage**: `https://your-app.up.railway.app`
   - Should load the FriendFinder landing page

2. **Login**: `https://your-app.up.railway.app/login`
   - Try logging in with existing credentials
   - Should redirect to dashboard on success

3. **Register**: `https://your-app.up.railway.app/register`
   - Create a new account
   - Should auto-login and redirect to dashboard

4. **API Health**: `https://your-app.up.railway.app/api/health`
   - Should return JSON: `{"status": "ok"}`

---

## 🔍 Troubleshooting

### Build Failing?

**Error**: `Failed to collect page data`
- **Solution**: Verify latest code is pushed to GitHub (commit `850e94d` or later)
- Redeploy: Click **Deploy** → **Redeploy**

**Error**: `Module not found`
- **Solution**: Delete `node_modules` and reinstall
- In Railway: **Settings** → **Delete Service** → Recreate
- Or push an empty commit: `git commit --allow-empty -m "trigger rebuild" && git push`

### Runtime Errors?

**Error**: `[next-auth][error][NO_SECRET]`
- **Solution**: Ensure `NEXTAUTH_SECRET` is set in Railway variables
- Generate new: `openssl rand -base64 32`

**Error**: `NEXTAUTH_URL must be set`
- **Solution**: Set `NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}`
- Or manually set: `NEXTAUTH_URL=https://your-app.up.railway.app`

**Error**: `MongooseServerSelectionError`
- **Solution**: Check MongoDB Atlas Network Access
- Allow Railway IPs or use 0.0.0.0/0 (all IPs)

### App Loads But Styling Broken?

**Check**:
1. Clear browser cache (Ctrl+Shift+R)
2. Check Railway logs for CSS compilation errors
3. Verify Next.js static files are being served

---

## 🎛️ Railway-Specific Features

### Environment Variables from Railway

Railway provides these automatically:

- `RAILWAY_ENVIRONMENT` - deployment environment (production/staging)
- `RAILWAY_PUBLIC_DOMAIN` - your app's public URL
- `RAILWAY_PROJECT_NAME` - project name
- `RAILWAY_SERVICE_NAME` - service name

You can use them in your `NEXTAUTH_URL`:

```bash
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
```

### View Logs

1. Click on your service
2. Go to **Deployments** tab
3. Click on latest deployment
4. View real-time logs

### Metrics & Monitoring

1. **Deployments** tab: See deployment history
2. **Metrics** tab: CPU, Memory, Network usage
3. **Settings** → **Observability**: Advanced monitoring

---

## 🔒 Security Best Practices

### Generate Production Secrets

Don't use development secrets in production:

```bash
# Generate new NEXTAUTH_SECRET for production
openssl rand -base64 32
```

Update in Railway Variables tab.

### MongoDB Security

1. Go to MongoDB Atlas → **Network Access**
2. Add IP: `0.0.0.0/0` (Railway uses dynamic IPs)
3. Or whitelist specific Railway IPs if available

### Environment Variables

- ✅ All secrets in Railway Variables (never in code)
- ✅ Use `${{RAILWAY_PUBLIC_DOMAIN}}` for dynamic URL
- ✅ Different secrets for dev and production
- ✅ Enable Railway's built-in secret management

---

## 💰 Pricing & Resource Management

### Free Tier Limits

Railway provides:
- $5 free credits per month
- Enough for development/testing
- Sleeps after 30 minutes of inactivity

### Production Recommendations

For production apps:
- **Upgrade to Hobby Plan**: $5/month (no sleep, more resources)
- **Monitor usage**: Check **Metrics** tab regularly
- **Set spending limits**: **Settings** → **Billing**

---

## 🔄 Continuous Deployment

Railway auto-deploys on every push:

1. Make changes locally
2. Commit: `git commit -m "your changes"`
3. Push: `git push origin main`
4. Railway automatically deploys
5. Check logs in Railway dashboard

### Manual Redeploy

If you need to redeploy without code changes:

1. Go to **Deployments** tab
2. Click **⋮** menu on latest deployment
3. Select **Redeploy**

---

## 🔧 Advanced Configuration

### Custom Build Commands

Create `railway.json` in project root:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Health Checks

Railway automatically monitors your app. To customize:

1. **Settings** → **Health Check Path**: `/api/health`
2. Railway will ping this endpoint
3. Auto-restart if unhealthy

---

## 📊 Expected Deployment Output

Your Railway logs should show:

```
=== Building Next.js App ===
✓ Creating an optimized production build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (63/63)
✓ Finalizing page optimization

Route (app)                                Size     First Load JS
┌ ○ /                                    3.9 kB         130 kB
├ ƒ /api/auth/[...nextauth]             264 B          102 kB
...

=== Starting Server ===
▲ Next.js 15.5.0
- Local:        http://0.0.0.0:3000
- Network:      http://0.0.0.0:3000

✓ Ready in 2.5s
```

---

## 🎯 Post-Deployment Checklist

- [ ] App accessible at Railway URL
- [ ] Login page styled correctly
- [ ] Can register new users
- [ ] Can login with credentials
- [ ] Dashboard loads properly
- [ ] MongoDB connected (check logs)
- [ ] No console errors (F12)
- [ ] Google OAuth working (if configured)

---

## 🆚 Railway vs Render Comparison

| Feature | Railway | Render |
|---------|---------|--------|
| Free tier | $5 credit/month | 750 hrs/month |
| Auto-deploy | ✅ Yes | ✅ Yes |
| Custom domains | ✅ Free SSL | ✅ Free SSL |
| Logs | Real-time | Real-time |
| Metrics | Built-in | Built-in |
| Database hosting | Redis/PostgreSQL | PostgreSQL |
| CLI | ✅ Yes | ✅ Yes |
| Ease of setup | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Recommendation**: Railway for easier setup, Render for longer free tier.

---

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Railway Status**: https://status.railway.app/

---

## 🚨 Common Railway Issues

### App Won't Start?

```bash
# Check start command is correct
npm start
# Should run: next start
```

### Port Issues?

Railway automatically sets `PORT` environment variable. Next.js uses port 3000 by default, which works fine.

### Memory Issues?

If app crashes due to memory:
1. **Settings** → **Resources**
2. Increase memory allocation
3. Or optimize your code/dependencies

---

**Last Updated**: November 2, 2025
**Status**: ✅ Ready for Railway deployment!
