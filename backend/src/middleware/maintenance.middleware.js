const prisma = require('../config/db');

// Cache to prevent hitting DB on every request
let cachedSettings = {
  maintenanceMode: false,
  registrationEnabled: true,
  lastFetched: 0
};

const getSystemSettings = async () => {
  const now = Date.now();
  if (now - cachedSettings.lastFetched < 10000) {
    return cachedSettings;
  }
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ['maintenanceMode', 'registrationEnabled'] } }
    });
    
    let foundRegistration = false;
    settings.forEach(s => {
      if (s.key === 'maintenanceMode') cachedSettings.maintenanceMode = s.value === 'true';
      if (s.key === 'registrationEnabled') {
        cachedSettings.registrationEnabled = s.value === 'true';
        foundRegistration = true;
      }
    });
    
    // Default to true if not set in DB yet
    if (!foundRegistration) {
      cachedSettings.registrationEnabled = true;
    }
    
    cachedSettings.lastFetched = now;
  } catch (err) {
    console.error('Failed to fetch system settings', err);
  }
  return cachedSettings;
};

exports.maintenanceCheck = async (req, res, next) => {
  // Allow admin and auth routes bypass (so admins can login and turn it off)
  if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/settings')) {
    return next();
  }
  
  const settings = await getSystemSettings();
  if (settings.maintenanceMode) {
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
