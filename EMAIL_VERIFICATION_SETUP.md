# Email Verification & Google OAuth Setup Guide

This guide will help you set up email verification with OTP and Google Sign-In/Sign-Up for FriendFinder.

## Features Implemented

✅ **Email Verification with OTP**
- 6-digit OTP sent to user's email upon registration
- OTP expires after 10 minutes
- Resend OTP functionality with 60-second cooldown
- Beautiful email templates with branding
- Users must verify email before they can log in

✅ **Google OAuth Sign-In/Sign-Up**
- One-click sign in with Google
- Auto-creates account if user doesn't exist
- Google accounts are pre-verified (no OTP required)
- Secure OAuth 2.0 implementation

✅ **Enhanced Security**
- Email verification prevents fake accounts
- Unverified users cannot access the dashboard
- Secure password hashing with bcrypt
- JWT-based session management

---

## 1. Email Service Setup (Required for OTP)

### Option A: Gmail (Recommended for Development)

1. **Enable 2-Step Verification**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "2-Step Verification"

2. **Create App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" as the app
   - Select "Other" as the device
   - Name it "FriendFinder"
   - Copy the 16-character password

3. **Add to .env.local**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASSWORD=your_16_character_app_password
   ```

### Option B: SendGrid (Recommended for Production)

1. **Create SendGrid Account**
   - Sign up at [SendGrid](https://sendgrid.com/)
   - Verify your sender email

2. **Create API Key**
   - Go to Settings → API Keys
   - Create a new API key with "Mail Send" permission
   - Copy the API key

3. **Add to .env.local**
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your_sendgrid_api_key
   ```

### Option C: Other Email Providers

**Outlook/Office365:**
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your.email@outlook.com
EMAIL_PASSWORD=your_password
```

**Yahoo Mail:**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your.email@yahoo.com
EMAIL_PASSWORD=your_app_password
```

**Mailgun:**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@your.domain.com
EMAIL_PASSWORD=your_mailgun_smtp_password
```

---

## 2. Google OAuth Setup (Required for Google Sign-In)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "FriendFinder" (or any name you prefer)
4. Click "Create"

### Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (for testing) or "Internal" (for organization only)
3. Fill in the required information:
   - **App name:** FriendFinder
   - **User support email:** Your email
   - **Developer contact email:** Your email
4. Click "Save and Continue"
5. Add scopes (optional for now)
6. Add test users if using "External" (add your Gmail for testing)
7. Click "Save and Continue"

### Step 4: Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Fill in the details:
   - **Name:** FriendFinder Web Client
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
5. Click "Create"
6. **Copy the Client ID and Client Secret**

### Step 5: Add to .env.local

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

## 3. Complete Environment Variables

Create or update your `.env.local` file with all required variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your_app_password_here

# Environment
NODE_ENV=development
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure random secret:
```bash
openssl rand -base64 32
```

Or in PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 4. Testing the Implementation

### Test Email Verification

1. **Register a new account:**
   - Go to `/register`
   - Fill in username, email, and password
   - Click "Create Account"

2. **Check your email:**
   - You should receive an email with a 6-digit OTP
   - The email will have a nice purple gradient design

3. **Verify email:**
   - You'll be redirected to `/verify-email?email=youremail`
   - Enter the 6-digit OTP
   - Click "Verify Email"

4. **Try logging in:**
   - Before verification: Login should fail with "Please verify your email"
   - After verification: Login should succeed

5. **Test resend OTP:**
   - Click "Resend Code" on verification page
   - Check email for new OTP
   - Notice 60-second cooldown timer

### Test Google Sign-In

1. **On Register or Login page:**
   - Click "Continue with Google" button
   - You'll be redirected to Google sign-in

2. **Sign in with Google:**
   - Choose your Google account
   - Grant permissions
   - You'll be redirected to `/dashboard`

3. **Check database:**
   - User should be created automatically
   - `isEmailVerified` should be `true` (Google accounts are pre-verified)
   - Username will be email prefix with timestamp

---

## 5. User Flow Diagrams

### Registration Flow
```
User fills form → Submit
                    ↓
            Account created
                    ↓
            OTP sent to email
                    ↓
    Redirect to /verify-email
                    ↓
         User enters OTP
                    ↓
    Email verified ✓ → Can login
```

### Login Flow
```
User enters credentials → Submit
                           ↓
                  Email verified? ── No → Error: "Verify email"
                           ↓
                          Yes
                           ↓
                  Password correct? ── No → Error: "Invalid credentials"
                           ↓
                          Yes
                           ↓
                    Login success ✓
                           ↓
                Redirect to /dashboard
```

### Google OAuth Flow
```
Click "Continue with Google"
            ↓
    Google OAuth popup
            ↓
    User grants permission
            ↓
Account exists? ── No → Create new account (pre-verified)
            ↓
           Yes
            ↓
   Login success ✓
            ↓
Redirect to /dashboard
```

---

## 6. Database Schema Updates

The User model now includes:

```typescript
{
  // Existing fields...
  email: string,
  username: string,
  password: string,
  
  // New email verification fields
  isEmailVerified: boolean,           // Default: false
  verificationOTP: string,            // 6-digit code
  verificationOTPExpires: Date,       // Expires in 10 minutes
  emailVerificationToken: string,     // For email link verification
  emailVerificationExpires: Date,     // Expires in 24 hours
}
```

---

## 7. API Endpoints

### Email Verification APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/send-otp` | POST | Send or resend OTP to email |
| `/api/auth/verify-otp` | POST | Verify OTP code |
| `/api/auth/verify-email` | GET | Verify email via link (future use) |

### Request/Response Examples

**Send OTP:**
```bash
POST /api/auth/send-otp
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 600
}
```

**Verify OTP:**
```bash
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

## 8. Email Templates

The verification emails include:
- 🎨 Beautiful gradient design (purple to blue)
- 📱 Mobile-responsive layout
- 🔢 Large, easy-to-read OTP code
- ⏰ Clear expiration time
- 🔒 Security warning for unauthorized attempts
- 🎨 FriendFinder branding

---

## 9. Troubleshooting

### Email Not Sending

**Check email credentials:**
```bash
# Test email configuration
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Common issues:**
- Gmail: Make sure 2FA is enabled and you're using App Password, not your regular password
- Firewall: Ensure port 587 is not blocked
- Credentials: Double-check EMAIL_USER and EMAIL_PASSWORD in .env.local

### Google OAuth Not Working

**Check configuration:**
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
- Ensure redirect URI matches exactly in Google Cloud Console
- For localhost testing, use `http://localhost:3000` (not 127.0.0.1)
- Check if Google+ API is enabled in Google Cloud Console

**Test OAuth endpoint:**
```bash
# This should redirect to Google
curl http://localhost:3000/api/auth/signin/google
```

### OTP Not Matching

- OTPs are case-sensitive and numeric only
- Check that OTP hasn't expired (10 minutes)
- Ensure no extra spaces when pasting
- Try resending OTP if expired

---

## 10. Security Best Practices

✅ **Implemented:**
- OTP expires after 10 minutes
- Rate limiting on resend (60-second cooldown)
- Passwords hashed with bcrypt (cost factor 12)
- Email tokens stored as hashed values
- HTTPS required for production
- JWT sessions with 30-day expiration

🔒 **Recommendations:**
- Use SendGrid or similar service for production (not Gmail)
- Enable rate limiting on API routes
- Add CAPTCHA for registration
- Monitor for suspicious activity
- Implement account lockout after failed attempts
- Use environment-specific secrets

---

## 11. Production Deployment

### Environment Variables for Production

Update your production environment (Render, Vercel, etc.) with:

```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate-new-random-secret>
GOOGLE_CLIENT_ID=<your-production-client-id>
GOOGLE_CLIENT_SECRET=<your-production-client-secret>
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=<sendgrid-api-key>
MONGODB_URI=<production-mongodb-uri>
NODE_ENV=production
```

### Update Google OAuth Redirect URIs

Add production URLs to Google Cloud Console:
- JavaScript origin: `https://yourdomain.com`
- Redirect URI: `https://yourdomain.com/api/auth/callback/google`

### Test in Production

1. Clear browser cache
2. Test registration flow end-to-end
3. Verify emails are being delivered
4. Test Google OAuth sign-in
5. Check error handling

---

## 12. Support & Debugging

### Enable Debug Mode

Add to .env.local:
```env
NODE_ENV=development
DEBUG=true
```

This will show detailed error messages in responses.

### Check Logs

**Email sending:**
```javascript
// Look for these in console
console.log('📧 Sending OTP email to:', email);
console.log('✅ Email sent successfully');
console.error('❌ Email failed:', error);
```

**OAuth:**
```javascript
// NextAuth debug mode
console.log('🔑 Google OAuth callback');
console.log('👤 User created:', user);
```

---

## 13. Additional Features (Optional)

Consider implementing:
- 📧 Email verification link (alongside OTP)
- 🔔 Welcome email after verification
- 🔄 Forgot password with email reset
- 📱 SMS OTP as alternative
- 🎨 Customizable email templates
- 📊 Analytics on verification success rate
- 🔒 Two-factor authentication (2FA)

---

## Summary

✅ **Email verification with OTP is fully functional**
✅ **Google OAuth sign-in/sign-up is ready**
✅ **Users must verify email before accessing dashboard**
✅ **Beautiful, branded verification emails**
✅ **Secure implementation with proper error handling**

**Next Steps:**
1. Add email credentials to .env.local
2. Add Google OAuth credentials to .env.local
3. Test registration → verification → login flow
4. Test Google sign-in
5. Deploy to production with production credentials

Need help? Check the troubleshooting section or review the API endpoint documentation above.
