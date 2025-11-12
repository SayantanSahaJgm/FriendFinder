# ✅ Email Sending Fixed - Setup Guide

## What Was Fixed

### 🐛 Issues Resolved:
1. **Bug in `sendVerificationLinkEmail`**: Was calling non-existent `createTransporter()` instead of `getTransporter()`
2. **Fire-and-forget email sending**: Emails were sent without waiting for confirmation, hiding errors
3. **Poor error logging**: No console output to diagnose email issues
4. **Missing error handling**: Forgot password didn't properly handle email failures

### ✨ Improvements Made:
1. ✅ All email functions now use `getTransporter()` correctly
2. ✅ Added `await` to properly wait for email sending
3. ✅ Added detailed console logging (📧, ✅, ❌ icons)
4. ✅ Better error messages with configuration hints
5. ✅ Proper error propagation to API responses

---

## 📧 Gmail Setup Guide (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/security
2. Click **"2-Step Verification"**
3. Follow steps to enable it (you'll need your phone)

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **"Mail"** and **"Other (Custom name)"**
3. Enter name: "FriendFinder App"
4. Click **"Generate"**
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update `.env` File
```bash
# Email Configuration for Gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # Your App Password (remove spaces)
```

**Important:** Remove spaces from app password: `abcdefghijklmnop`

---

## 🧪 Testing Email Configuration

### Method 1: Test API Endpoint
Create a test file to check email configuration:

```bash
# Test if email is configured
curl http://localhost:3000/api/auth/test
```

### Method 2: Check Server Logs
When you send an email, you'll now see clear logs:

**✅ Success:**
```
📧 Attempting to send OTP email to: user@example.com
✅ OTP email sent successfully: <message-id>
```

**❌ Failure:**
```
❌ Email transporter not configured
Error: Email service not configured. Please check EMAIL_USER and EMAIL_PASSWORD in .env
```

---

## 🔍 Troubleshooting

### Issue: "Email service not configured"
**Solution:** 
- Check `.env` file has `EMAIL_USER` and `EMAIL_PASSWORD`
- Restart your Next.js server after updating `.env`

### Issue: "Invalid login"
**Solutions:**
1. Make sure you're using **App Password**, not regular Gmail password
2. Remove all spaces from app password
3. Verify 2FA is enabled on your Google account

### Issue: "Connection timeout"
**Solutions:**
1. Check your internet connection
2. Try changing `EMAIL_PORT` to `465` and `EMAIL_SECURE=true`
3. Check if your firewall is blocking SMTP

### Issue: Emails going to spam
**Solutions:**
1. Add `noreply@yourdomain.com` to contacts
2. Mark first email as "Not Spam"
3. Consider using a custom domain with proper DNS records (SPF, DKIM)

---

## 🌐 Alternative Email Providers

### Outlook/Hotmail
```bash
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@outlook.com
EMAIL_PASSWORD=your_password
```

### Yahoo Mail
```bash
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@yahoo.com
EMAIL_PASSWORD=your_app_password  # Generate at account.yahoo.com
```

### SendGrid (Recommended for Production)
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
```

Get API key from: https://app.sendgrid.com/settings/api_keys

---

## 📝 Features That Use Email

### 1. **Registration** (`/register`)
- Sends OTP for email verification
- Expires in 10 minutes
- API: `POST /api/auth/send-otp`

### 2. **Forgot Password** (`/forgot-password`)
- Sends OTP to reset password
- Expires in 15 minutes
- API: `POST /api/auth/forgot-password`

### 3. **Email Verification Link** (Optional)
- Alternative to OTP
- Expires in 24 hours
- API: Uses `sendVerificationLinkEmail()`

---

## 🚀 Quick Test

1. **Start your server:**
```powershell
npm run dev
```

2. **Register a new account:**
   - Go to http://localhost:3000/register
   - Enter your email
   - Check console for: `📧 Attempting to send OTP email to: ...`
   - Check your inbox/spam for the OTP

3. **Test forgot password:**
   - Go to http://localhost:3000/forgot-password
   - Enter registered email
   - Check console for: `🔐 Sending password reset email to: ...`
   - Check inbox for reset code

---

## ✅ Verification Checklist

- [ ] `.env` file has all email variables
- [ ] Gmail App Password generated (if using Gmail)
- [ ] Spaces removed from app password
- [ ] Server restarted after `.env` changes
- [ ] Console shows `📧` and `✅` when sending emails
- [ ] Email arrives in inbox (check spam folder)
- [ ] OTP codes work correctly
- [ ] Password reset works

---

## 💡 Pro Tips

1. **Use SendGrid for production** - More reliable and won't hit Gmail's sending limits
2. **Monitor email logs** - Check console for `📧`, `✅`, or `❌` messages
3. **Test with multiple providers** - Have a fallback email service
4. **Custom domain** - Improves deliverability (emails less likely to be spam)
5. **Rate limiting** - Implement cooldown between OTP requests

---

## 🎉 All Fixed!

Your email system is now working correctly with:
- ✅ Proper error handling
- ✅ Detailed logging
- ✅ Registration OTP emails
- ✅ Password reset emails
- ✅ Verification link emails

If you still have issues, check the console logs for specific error messages!
