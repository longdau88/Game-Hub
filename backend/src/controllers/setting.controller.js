const prisma = require('../config/db');
const { clearSettingsCache } = require('../middleware/maintenance.middleware');
const auditLogService = require('../services/audit.service');

exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    
    // Convert array of {key, value} to an object
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    
    // Provide defaults if not exist
    if (!settingsObj['maintenanceMode']) settingsObj['maintenanceMode'] = 'false';
    if (!settingsObj['registrationEnabled']) settingsObj['registrationEnabled'] = 'true';
    if (!settingsObj['maxUploadSizeMB']) settingsObj['maxUploadSizeMB'] = '100';
    
    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    }
    
    clearSettingsCache(); // Clear the cache so changes take effect immediately
    await auditLogService.log(req.user.userId, 'UPDATE_SYSTEM_SETTINGS', 'SystemSetting', {
      updatedKeys: Object.keys(settings)
    });
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
