const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const { getSystemSettings } = require('../middleware/maintenance.middleware');

const resend = new Resend(process.env.RESEND_API_KEY);

// Use the verified domain from Resend
const FROM_EMAIL = process.env.EMAIL_FROM || 'no-reply@game-hub.best';

const smtpTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendVerificationEmail = async (to, token) => {
  const verificationLink = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  try {
    if (!process.env.RESEND_API_KEY && !process.env.EMAIL_USER) {
      console.log("Mock Verification Email Sent to:", to);
      console.log("Verification Link:", verificationLink);
      return;
    }

    const settings = await getSystemSettings();
    const provider = settings.emailProvider || 'resend';

    if (provider === 'smtp') {
      await smtpTransporter.sendMail({
        from: `"Game Hub" <${FROM_EMAIL}>`,
        to: to,
        subject: 'Verify your Game Hub account',
        html: `
          <h1>Welcome to Game Hub!</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationLink}">${verificationLink}</a>
        `
      });
    } else {
      const { data, error } = await resend.emails.send({
        from: `Game Hub <${FROM_EMAIL}>`,
        to: [to],
        subject: 'Verify your Game Hub account',
        html: `
          <h1>Welcome to Game Hub!</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationLink}">${verificationLink}</a>
        `
      });

      if (error) {
        console.error('Resend verification email failed:', error);
      }
    }
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

exports.sendOtpEmail = async (to, code) => {
  try {
    if (!process.env.RESEND_API_KEY && !process.env.EMAIL_USER) {
      console.log("Mock OTP Sent to:", to);
      console.log("OTP Code:", code);
      return;
    }

    const settings = await getSystemSettings();
    const provider = settings.emailProvider || 'resend';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb; text-align: center;">Welcome to Game Hub!</h2>
        <p style="font-size: 16px; color: #333;">Hello,</p>
        <p style="font-size: 16px; color: #333;">Your verification code is:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h1 style="margin: 0; font-family: monospace; letter-spacing: 5px; color: #1f2937;">${code}</h1>
        </div>
        <p style="font-size: 14px; color: #666;">This code will expire in 1 minute.</p>
        <p style="font-size: 14px; color: #666;">If you did not request this code, please ignore this email.</p>
      </div>
    `;

    if (provider === 'smtp') {
      await smtpTransporter.sendMail({
        from: `"Game Hub" <${FROM_EMAIL}>`,
        to: to,
        subject: 'Your Game Hub Verification Code',
        html: htmlContent
      });
    } else {
      const { data, error } = await resend.emails.send({
        from: `Game Hub <${FROM_EMAIL}>`,
        to: [to],
        subject: 'Your Game Hub Verification Code',
        html: htmlContent
      });

      if (error) {
        console.error('Resend OTP email failed:', error);
      }
    }
  } catch (error) {
    console.error('Email OTP sending failed:', error);
  }
};
