const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
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
  } catch (error) {
    console.error('Failed to send email (exception):', error);
    return { success: false, error };
  }
};

module.exports = { sendEmail };
