import nodemailer from 'nodemailer';

/**
 * Email service for sending verification emails, OTPs, and notifications
 */

// Create reusable transporter
const createTransporter = () => {
  // Use environment variables for email configuration
  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  };

  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('⚠️ Email credentials not configured. Email service will not work.');
    return null;
  }

  return nodemailer.createTransport(emailConfig);
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
 * Send OTP verification email
 */
export async function sendOTPEmail(
  email: string,
  username: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

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
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 8px;
              margin: 30px 0;
              padding: 20px;
              background: #f7f7f7;
              border-radius: 8px;
              display: inline-block;
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
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 Welcome to FriendFinder!</h1>
            <div class="content">
              <h2>Hi ${username}! 👋</h2>
              <p>Thank you for signing up with FriendFinder. To complete your registration, please verify your email address by entering the OTP code below:</p>
              
              <div class="otp-code">${otp}</div>
              
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              
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
        
        Your email verification code is: ${otp}
        
        This code will expire in 10 minutes.
        
        If you didn't create this account, please ignore this email.
        
        © ${new Date().getFullYear()} FriendFinder
      `,
    };

    await transporter.sendMail(mailOptions);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
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
    const transporter = createTransporter();
    
    if (!transporter) {
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

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

    await transporter.sendMail(mailOptions);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending verification link email:', error);
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
    const transporter = createTransporter();
    
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
