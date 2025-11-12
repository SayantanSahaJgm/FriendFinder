import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Get form data
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const subject = formData.get("subject") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const steps = formData.get("steps") as string;
    const expectedBehavior = formData.get("expectedBehavior") as string;
    const actualBehavior = formData.get("actualBehavior") as string;

    // Validate required fields
    if (!name || !email || !subject || !description) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // Prepare email content
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .section { background-color: white; margin-bottom: 20px; padding: 15px; border-left: 4px solid #2563eb; }
    .label { font-weight: bold; color: #1e40af; margin-top: 10px; }
    .value { margin-left: 10px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .badge { 
      display: inline-block; 
      padding: 4px 12px; 
      border-radius: 12px; 
      font-size: 12px; 
      font-weight: bold; 
      text-transform: uppercase;
    }
    .badge-bug { background-color: #fecaca; color: #991b1b; }
    .badge-feature { background-color: #bfdbfe; color: #1e3a8a; }
    .badge-performance { background-color: #fed7aa; color: #9a3412; }
    .badge-security { background-color: #fca5a5; color: #7f1d1d; }
    .badge-ui { background-color: #d9f99d; color: #365314; }
    .badge-other { background-color: #e5e7eb; color: #374151; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🐛 New Bug Report / Issue Submitted</h1>
  </div>
  
  <div class="content">
    <div class="section">
      <h2>📋 Report Information</h2>
      <div class="label">Report ID:</div>
      <div class="value">#${Date.now()}</div>
      
      <div class="label">Category:</div>
      <div class="value">
        <span class="badge badge-${category}">${category.toUpperCase()}</span>
      </div>
      
      <div class="label">Date Submitted:</div>
      <div class="value">${new Date().toLocaleString()}</div>
    </div>

    <div class="section">
      <h2>👤 Reporter Information</h2>
      <div class="label">Name:</div>
      <div class="value">${name}</div>
      
      <div class="label">Email:</div>
      <div class="value"><a href="mailto:${email}">${email}</a></div>
      
      ${session ? `
      <div class="label">User ID:</div>
      <div class="value">${session.user?.id || "N/A"}</div>
      
      <div class="label">Username:</div>
      <div class="value">${session.user?.name || "N/A"}</div>
      ` : ""}
    </div>

    <div class="section">
      <h2>📝 Issue Details</h2>
      <div class="label">Subject:</div>
      <div class="value"><strong>${subject}</strong></div>
      
      <div class="label">Description:</div>
      <div class="value">${description.replace(/\n/g, "<br>")}</div>
    </div>

    ${steps ? `
    <div class="section">
      <h2>🔄 Steps to Reproduce</h2>
      <div class="value">${steps.replace(/\n/g, "<br>")}</div>
    </div>
    ` : ""}

    ${expectedBehavior || actualBehavior ? `
    <div class="section">
      <h2>🎯 Expected vs Actual Behavior</h2>
      ${expectedBehavior ? `
      <div class="label">Expected:</div>
      <div class="value" style="color: #059669;">${expectedBehavior.replace(/\n/g, "<br>")}</div>
      ` : ""}
      
      ${actualBehavior ? `
      <div class="label">Actual:</div>
      <div class="value" style="color: #dc2626;">${actualBehavior.replace(/\n/g, "<br>")}</div>
      ` : ""}
    </div>
    ` : ""}

    <div class="section">
      <h2>💻 Technical Information</h2>
      <div class="label">User Agent:</div>
      <div class="value" style="font-size: 11px; color: #6b7280;">
        ${request.headers.get("user-agent") || "N/A"}
      </div>
      
      <div class="label">IP Address:</div>
      <div class="value">${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "N/A"}</div>
    </div>
  </div>

  <div class="footer">
    <p>This is an automated report from FriendFinder Bug Reporting System</p>
    <p>Please review and respond to the reporter as soon as possible</p>
  </div>
</body>
</html>
    `;

    // Send email to support team
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@friendfinder.com",
      to: process.env.SUPPORT_EMAIL || "support@friendfinder.com",
      subject: `🐛 Bug Report: ${subject} [${category}]`,
      html: emailContent,
      replyTo: email,
    };

    console.log("📧 Sending bug report email...");
    await transporter.sendMail(mailOptions);
    console.log("✅ Bug report email sent successfully");

    // Send confirmation email to reporter
    const confirmationEmail = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .section { background-color: white; margin-bottom: 20px; padding: 15px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Report Received - Thank You!</h1>
  </div>
  
  <div class="content">
    <div class="section">
      <h2>Hi ${name},</h2>
      <p>Thank you for taking the time to report an issue with FriendFinder. Your feedback helps us improve!</p>
      
      <p><strong>Report ID:</strong> #${Date.now()}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Category:</strong> ${category}</p>
      
      <h3>What happens next?</h3>
      <ul>
        <li>✅ Our team will review your report within 24-48 hours</li>
        <li>📧 We'll contact you at <strong>${email}</strong> if we need more information</li>
        <li>🔧 If it's a bug, we'll work on fixing it in the next update</li>
        <li>💡 If it's a feature request, we'll consider it for future releases</li>
      </ul>
      
      <p>For urgent security issues, please email us directly at <a href="mailto:security@friendfinder.com">security@friendfinder.com</a></p>
    </div>
  </div>

  <div class="footer">
    <p>FriendFinder Support Team</p>
    <p>Contact us: <a href="mailto:support@friendfinder.com">support@friendfinder.com</a> | Call: +1-800-FRIEND-1</p>
  </div>
</body>
</html>
    `;

    const confirmationMailOptions = {
      from: process.env.EMAIL_FROM || "noreply@friendfinder.com",
      to: email,
      subject: `✅ Bug Report Received - FriendFinder`,
      html: confirmationEmail,
    };

    console.log("📧 Sending confirmation email to reporter...");
    await transporter.sendMail(confirmationMailOptions);
    console.log("✅ Confirmation email sent");

    return NextResponse.json({
      success: true,
      message: "Report submitted successfully! Check your email for confirmation.",
    });
  } catch (error) {
    console.error("❌ Error submitting report:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit report. Please try again or email us directly.",
      },
      { status: 500 }
    );
  }
}
