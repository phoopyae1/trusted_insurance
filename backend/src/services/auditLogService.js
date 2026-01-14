const prisma = require('../prisma');

async function logAudit({ actorId = null, action, entityType, entityId, metadata = null }) {
  if (!action || !entityType || !entityId) {
    return null;
  }
  return prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId: String(entityId),
      metadata
    }
  });
}

module.exports = { logAudit };
