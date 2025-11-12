import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Email service for sending verification emails, OTPs, and notifications
 * Optimized with connection pooling for faster email delivery
 */

// Create singleton transporter with connection pooling for better performance
let transporter: Transporter | null = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  // Use environment variables for email configuration
  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Connection pooling for faster email sending
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // Reduce timeouts for faster failure detection
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  };

  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('⚠️ Email credentials not configured. Email service will not work.');
    return null;
  }

  transporter = nodemailer.createTransport(emailConfig);
  return transporter;
};

/**
 * Generate a random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a random verification token
 */
export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Send OTP verification email (optimized for speed)
 */
export async function sendOTPEmail(
  email: string,
  username: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      console.error('❌ Email transporter not configured');
      return {
        success: false,
        error: 'Email service not configured. Please check EMAIL_USER and EMAIL_PASSWORD in .env',
      };
    }

    console.log('📧 Attempting to send OTP email to:', email);

    const mailOptions = {
      from: `"FriendFinder" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - FriendFinder',
      // Simplified HTML for faster sending
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; text-align: center; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 20px 0; padding: 15px; background: #f7f7f7; border-radius: 8px; display: inline-block; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to FriendFinder!</h1>
            </div>
            <div class="content">
              <h2>Hi ${username}! 👋</h2>
              <p>Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p>This code expires in <strong>10 minutes</strong>.</p>
              <p style="color: #e74c3c; font-size: 14px;">⚠️ If you didn't create this account, ignore this email.</p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} FriendFinder. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to FriendFinder, ${username}!\n\nYour email verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't create this account, please ignore this email.`,
    };

    // Wait for email to send to catch errors properly
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully:', info.messageId);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send verification link email
 */
export async function sendVerificationLinkEmail(
  email: string,
  username: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      console.error('❌ Email transporter not configured');
      return {
        success: false,
        error: 'Email service not configured. Please check EMAIL_USER and EMAIL_PASSWORD in .env',
      };
    }

    console.log('📧 Attempting to send verification link email to:', email);

    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"FriendFinder" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - FriendFinder',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px;
              border-radius: 10px;
              text-align: center;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              opacity: 0.9;
            }
            .warning {
              color: #e74c3c;
              font-size: 14px;
              margin-top: 20px;
            }
            h1 {
              color: white;
              margin: 0;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .link {
              word-break: break-all;
              color: #667eea;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 Welcome to FriendFinder!</h1>
            <div class="content">
              <h2>Hi ${username}! 👋</h2>
              <p>Thank you for signing up with FriendFinder. To complete your registration, please verify your email address by clicking the button below:</p>
              
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              
              <p>Or copy and paste this link into your browser:</p>
              <p class="link">${verificationUrl}</p>
              
              <p>This link will expire in <strong>24 hours</strong>.</p>
              
              <p class="warning">⚠️ If you didn't create this account, please ignore this email.</p>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} FriendFinder. All rights reserved.</p>
                <p>Connect with people around you!</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to FriendFinder, ${username}!
        
        Please verify your email by clicking this link:
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create this account, please ignore this email.
        
        © ${new Date().getFullYear()} FriendFinder
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification link email sent successfully:', info.messageId);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending verification link email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send password reset email with OTP (optimized for speed)
 */
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      console.error('❌ Email transporter not configured');
      return {
        success: false,
        error: 'Email service not configured. Please check EMAIL_USER and EMAIL_PASSWORD in .env',
      };
    }

    console.log('📧 Attempting to send password reset email to:', email);

    const mailOptions = {
      from: `"FriendFinder" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - FriendFinder',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; text-align: center; }
            .otp-code { font-size: 32px; font-weight: bold; color: #ef4444; letter-spacing: 5px; margin: 20px 0; padding: 15px; background: #fee2e2; border-radius: 8px; display: inline-block; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .warning { color: #dc2626; font-size: 14px; margin-top: 15px; padding: 10px; background: #fee2e2; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${username}!</h2>
              <p>We received a request to reset your password. Use this code to proceed:</p>
              <div class="otp-code">${otp}</div>
              <p>This code expires in <strong>15 minutes</strong>.</p>
              <div class="warning">
                ⚠️ If you didn't request this, please ignore this email and secure your account.
              </div>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} FriendFinder. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Password Reset - FriendFinder\n\nHi ${username}!\n\nYour password reset code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
    };

    // Wait for email to send to catch errors properly
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', info.messageId);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    
    if (!transporter) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    await transporter.verify();
    return { success: true };
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email configuration test failed',
    };
  }
}
