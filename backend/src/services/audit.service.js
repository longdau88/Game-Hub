const prisma = require('../config/db');

class AuditLogService {
  async log(adminId, action, entity, details = {}) {
    try {
      if (!adminId) return;
      await prisma.auditLog.create({
        data: { adminId, action, entity, details }
      });
    } catch (err) {
      console.error('[AuditLog] Failed to write log:', err.message);
    }
  }
}

module.exports = new AuditLogService();
