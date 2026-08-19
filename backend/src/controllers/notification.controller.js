const prisma = require('../config/db');
const { EventEmitter } = require('events');

// SSE: Map of userId -> array of response objects
const clients = new Map();

// Helper: push notification to all SSE clients of a user
exports.pushToUser = (userId, notification) => {
  const key = String(userId);
  const userClients = clients.get(key) || [];
  userClients.forEach(res => {
    try {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    } catch (e) {}
  });
};

// SSE stream endpoint
exports.streamNotifications = (req, res) => {
  const key = String(req.user.userId);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  // Register this client
  if (!clients.has(key)) clients.set(key, []);
  clients.get(key).push(res);

  // Send heartbeat every 25s to keep connection alive
  const heartbeat = setInterval(() => {
    try { res.write(':heartbeat\n\n'); } catch (e) {}
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const remaining = (clients.get(key) || []).filter(r => r !== res);
    if (remaining.length === 0) {
      clients.delete(key);
    } else {
      clients.set(key, remaining);
    }
  });
};


exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50
    });
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { 
        id,
        userId: req.user.userId
      },
      data: { isRead: true }
    });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
