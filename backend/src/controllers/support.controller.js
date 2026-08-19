const prisma = require('../config/db');

exports.createTicket = async (req, res) => {
  try {
    const { email, subject, message } = req.body;
    
    if (!email || !subject || !message) {
      return res.status(400).json({ error: 'Email, subject and message are required' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        email,
        subject,
        message,
        status: 'OPEN'
      }
    });

    res.status(201).json({ success: true, message: 'Support ticket created successfully', ticket });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
};
