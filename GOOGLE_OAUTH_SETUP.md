# Google OAuth Setup Guide

This guide will help you enable Google Sign-In for your FriendFinder application.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `FriendFinder` (or your preferred name)
4. Click **Create**

## Step 2: Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for testing) and click **Create**
3. Fill in the required fields:
   - **App name**: FriendFinder
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **Save and Continue**
5. On **Scopes** page, click **Save and Continue**
6. On **Test users** page:
   - Click **Add Users**
   - Add your email and other test users
   - Click **Save and Continue**
7. Click **Back to Dashboard**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Set the following:
   - **Name**: FriendFinder Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `https://your-app-name.onrender.com` (your production URL)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-app-name.onrender.com/api/auth/callback/google`
5. Click **Create**

## Step 5: Copy Your Credentials

After creating the OAuth client, you'll see a modal with:
- **Client ID**: Looks like `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret**: Looks like `GOCSPX-abc123def456`

**Copy these values!**

## Step 6: Update Your Environment Variables

### For Local Development (`.env.local`)

1. Open `.env.local` file
2. Uncomment and update these lines:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
   ```

### For Production (Render)

1. Go to your [Render Dashboard](https://dashboard.render.com/)
2. Select your service
3. Go to **Environment** tab
4. Add these environment variables:
   - Key: `GOOGLE_CLIENT_ID`, Value: `your-client-id.apps.googleusercontent.com`
   - Key: `GOOGLE_CLIENT_SECRET`, Value: `GOCSPX-your-client-secret`
5. Click **Save Changes**

## Step 7: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Start again
npm run dev
```

## Step 8: Test Google Sign-In

1. Open your app at `http://localhost:3000/login`
2. You should now see a **Sign in with Google** button
3. Click it and test the login flow
4. Only test users you added in Step 3.6 can sign in during testing

## Troubleshooting

### Error: "Access blocked: This app's request is invalid"

- Make sure you added the correct redirect URI in Google Console
- Verify the URI exactly matches: `http://localhost:3000/api/auth/callback/google`

### Error: "redirect_uri_mismatch"

- Double-check the redirect URIs in Google Console
- Ensure there are no trailing slashes
- Protocol must match (http vs https)

### Google Sign-In button not showing

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env.local`
- Restart your dev server after adding environment variables
- Check browser console for errors

### Error: "This app isn't verified"

- This is normal during development
- Click **Advanced** → **Go to FriendFinder (unsafe)**
- For production, you'll need to submit for Google verification

## Publishing Your App (Production)

When ready for production:

1. **Update OAuth consent screen**:
   - Change from "External" to "Internal" (if using Google Workspace)
   - Or submit for verification for public use

2. **Update authorized domains**:
   - Add your production domain to authorized domains list

3. **Deploy to Render**:
   - Ensure all environment variables are set
   - Deploy and test

## Security Best Practices

✅ **Do:**
- Keep your Client Secret secure
- Never commit `.env.local` to git
- Use environment variables for all sensitive data
- Regularly rotate your secrets

❌ **Don't:**
- Share your Client Secret publicly
- Hardcode credentials in your source code
- Use development credentials in production

## Support

For more information, visit:
- [NextAuth.js Google Provider Docs](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
