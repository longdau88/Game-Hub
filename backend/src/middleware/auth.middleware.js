const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

exports.requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is banned
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.isBanned) {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }
    
    // Update role just in case it changed since token was issued
    req.user = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

exports.optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (user && !user.isBanned) {
      req.user = { userId: user.id, role: user.role };
    }
  } catch (error) {
    // Ignore invalid tokens for optional auth
  }
  next();
};

exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};
