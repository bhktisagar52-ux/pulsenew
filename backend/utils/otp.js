const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Generate a 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP via email (you'll need to configure your email service)
async function sendOTPEmail(email, otp) {
  try {
    // For development/testing, we'll simulate email sending
    // In production, configure your email service (Gmail, SendGrid, etc.)

    console.log('='.repeat(60));
    console.log('📧 PULSE EMAIL VERIFICATION');
    console.log('='.repeat(60));
    console.log(`To: ${email}`);
    console.log(`Subject: Email Verification OTP - Pulse`);
    console.log('');
    console.log('Your verification code for Pulse is:');
    console.log('');
    console.log(`   ████████`);
    console.log(`   ██    ██`);
    console.log(`   ████████`);
    console.log(`   ██    ██`);
    console.log(`   ████████`);
    console.log('');
    console.log(`       ${otp}`);
    console.log('');
    console.log('This code will expire in 10 minutes.');
    console.log('');
    console.log('If you didn\'t request this verification, please ignore this email.');
    console.log('='.repeat(60));
    console.log('📧 Email simulation complete - Use the OTP above for testing');
    console.log('='.repeat(60));

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For development/testing, we'll use Ethereal Email (free testing service)
    // In production, configure your email service (Gmail, SendGrid, etc.)

    // For Gmail (requires app password setup)
    // 1. Enable 2-factor authentication on your Gmail account
    // 2. Generate an app password: https://support.google.com/accounts/answer/185833
    // 3. Set EMAIL_USER and EMAIL_APP_PASSWORD in your .env file

    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_APP_PASSWORD;

    console.log('🔧 Email Configuration Check:');
    console.log('EMAIL_USER:', emailUser ? 'Set' : 'Not set');
    console.log('EMAIL_APP_PASSWORD:', emailPassword ? 'Set' : 'Not set');

    if (!emailUser || !emailPassword || emailUser === 'your-gmail@gmail.com' || emailPassword === 'your-app-password') {
      console.log('⚠️  Email credentials not configured. Using console simulation only.');
      console.log('📧 To enable real email sending:');
      console.log('   1. Set EMAIL_USER and EMAIL_APP_PASSWORD in .env file');
      console.log('   2. Restart the server');
      return true; // Return success for console simulation
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });

    const mailOptions = {
      from: '"Pulse App" <noreply@pulseapp.com>',
      to: email,
      subject: 'Email Verification OTP - Pulse',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Pulse</h1>
            <p style="color: #e8e8e8; margin: 10px 0 0 0;">Email Verification</p>
          </div>
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
            <p style="color: #666; line-height: 1.6;">Your verification code for Pulse is:</p>
            <div style="background-color: #f8f9fa; border: 2px solid #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #666; line-height: 1.6;"><strong>This code will expire in 10 minutes.</strong></p>
            <p style="color: #999; font-size: 14px; line-height: 1.6;">If you didn't request this verification, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">This is an automated message from Pulse. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));

    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
}

module.exports = {
  generateOTP,
  sendOTPEmail
};
