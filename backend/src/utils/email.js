const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Game Hub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    return { success: true, data: info };
  } catch (error) {
    console.error('Failed to send email via nodemailer:', error);
    return { success: false, error };
  }
};

module.exports = { sendEmail };
