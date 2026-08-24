const prisma = require('../config/db');

// Cache to prevent hitting DB on every request
let cachedSettings = {
  maintenanceMode: false,
  registrationEnabled: true,
  emailProvider: 'resend',
  lastFetched: 0
};

const getSystemSettings = async () => {
  const now = Date.now();
  if (now - cachedSettings.lastFetched < 10000) {
    return cachedSettings;
  }
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ['maintenanceMode', 'registrationEnabled', 'emailProvider'] } }
    });
    
    let foundRegistration = false;
    let foundEmailProvider = false;
    settings.forEach(s => {
      if (s.key === 'maintenanceMode') cachedSettings.maintenanceMode = s.value === 'true';
      if (s.key === 'registrationEnabled') {
        cachedSettings.registrationEnabled = s.value === 'true';
        foundRegistration = true;
      }
      if (s.key === 'emailProvider') {
        cachedSettings.emailProvider = s.value;
        foundEmailProvider = true;
      }
    });
    
    // Default to true if not set in DB yet
    if (!foundRegistration) {
      cachedSettings.registrationEnabled = true;
    }
    
    if (!foundEmailProvider) {
      cachedSettings.emailProvider = 'resend';
    }
    
    cachedSettings.lastFetched = now;
  } catch (err) {
    console.error('Failed to fetch system settings', err);
  }
  return cachedSettings;
};

exports.getSystemSettings = getSystemSettings;

exports.clearSettingsCache = () => {
  cachedSettings.lastFetched = 0;
};

const jwt = require('jsonwebtoken');

exports.maintenanceCheck = async (req, res, next) => {
  // Allow system status and specific routes to bypass
  if (req.path.startsWith('/api/system/status') || req.path.startsWith('/api/admin') || req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/settings')) {
    return next();
  }
  
  const settings = await getSystemSettings();
  if (settings.maintenanceMode) {
    // Check if user is admin
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123');
        if (decoded.role === 'admin') {
          return next();
        }
      } catch (err) {
        // Ignore invalid token, just block them
      }
    }
    
    return res.status(503).json({ error: 'System is currently under maintenance. Please try again later.' });
  }
  next();
};

exports.checkRegistrationEnabled = async (req, res, next) => {
  const settings = await getSystemSettings();
  if (!settings.registrationEnabled) {
    return res.status(403).json({ error: 'Registration is currently disabled by administrator.' });
  }
  next();
};
