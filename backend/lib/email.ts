// Custom email service using SMTP (Nodemailer)
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log('🔍 sendEmail function called');
  
  try {
    // Extract verification link for logging
    const linkMatch = options.html.match(/href="([^"]+)"/);
    const verificationLink = linkMatch ? linkMatch[1] : 'Link not found';
    
    console.log('🔍 Verification link extracted:', verificationLink ? 'Yes' : 'No');

    // Always log to console (helpful for debugging)
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    📧 VERIFICATION EMAIL                       ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║ To:', options.to.padEnd(57), '║');
    console.log('║ Subject:', options.subject.padEnd(52), '║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║ 🔗 VERIFICATION LINK:                                         ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║', verificationLink.substring(0, 61).padEnd(61), '║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Send email using SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        // Create transporter
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        // Send email
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });

        console.log('✅ Email sent successfully via SMTP:', info.messageId);
        return true;
      } catch (error) {
        console.error('❌ Failed to send email via SMTP:', error);
        return false;
      }
    } else {
      console.warn('⚠️  SMTP not configured - email not sent (but link is logged above)');
      console.warn('   Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local');
      return true; // Return true so signup doesn't fail
    }
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export function generateVerificationEmail(
  email: string,
  verificationUrl: string,
  fullName?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to Finance Tracker!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${fullName || email.split('@')[0]},</p>
        
        <p style="font-size: 16px;">
          Thank you for signing up! Please verify your email address to complete your registration and start tracking your finances.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 40px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-size: 16px; 
                    font-weight: bold;
                    display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link into your browser:
        </p>
        <p style="font-size: 12px; color: #666; word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
          ${verificationUrl}
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          This link will expire in 24 hours for security reasons.
        </p>
        
        <p style="font-size: 14px; color: #666;">
          If you didn't create an account, you can safely ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          Finance Tracker - Personal Finance Management
        </p>
      </div>
    </body>
    </html>
  `;
}
