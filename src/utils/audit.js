const AuditLog = require('../models/AuditLog');

const logAudit = async ({ userId, action, entity, entityId, details = {} }) => {
  try {
    await AuditLog.create({ userId, action, entity, entityId, details });
  } catch (error) {
    // Silent failure for non-critical logging.
  }
};

module.exports = { logAudit };
