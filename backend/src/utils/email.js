const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const prisma = require('../config/db');

const resend = new Resend(process.env.RESEND_API_KEY);
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    // Determine provider from settings
    let provider = 'resend';
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'emailProvider' }
      });
      if (setting && setting.value) {
        provider = setting.value;
      }
    } catch (e) {
      console.error('Error fetching emailProvider setting:', e);
    }

    if (provider === 'nodemailer') {
      const info = await transporter.sendMail({
        from: `"Game Hub" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });
      return { success: true, data: info };
    } else {
      const { data, error } = await resend.emails.send({
        from: 'Game Hub <onboarding@resend.dev>', // Update this to your verified domain later if you have one
        to,
        subject,
        html
      });
      
      if (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
      }
      return { success: true, data };
    }
  } catch (error) {
    console.error('Failed to send email (exception):', error);
    return { success: false, error };
  }
};

module.exports = { sendEmail };
