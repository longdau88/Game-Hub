const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'test@gmail.com',
    pass: process.env.EMAIL_PASS || 'password', // Gmail App Password
  },
});

exports.sendVerificationEmail = async (to, token) => {
  const verificationLink = `http://localhost:3000/verify-email?token=${token}`;
  
  const mailOptions = {
    from: '"Game Hub" <no-reply@gamehub.com>',
    to,
    subject: 'Verify your Game Hub Account',
    html: `
      <h2>Welcome to Game Hub!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationLink}" style="padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    // In a real app we'd verify the env config, for dev we might just log if not configured
    if (!process.env.EMAIL_USER) {
      console.log("Mock Email Sent to:", to);
      console.log("Verification Link:", verificationLink);
      return;
    }
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};
