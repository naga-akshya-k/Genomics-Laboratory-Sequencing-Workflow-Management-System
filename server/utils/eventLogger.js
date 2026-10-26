const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const logAudit = async ({ user, action, entityType, entityId, details, req }) => {
  try {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
    const userId = user?._id || user;
    if (userId) {
      await AuditLog.create({
        user: userId,
        action,
        entityType,
        entityId: String(entityId || ''),
        details: String(details || ''),
        ipAddress: String(ipAddress),
      });
    }
  } catch (err) {
    console.error('[AuditLog Error]', err.message);
  }
};

const notifyUser = async ({ recipient, title, message, type = 'system', link = '' }) => {
  try {
    if (recipient) {
      return await Notification.create({
        recipient,
        title,
        message,
        type,
        link,
      });
    }
  } catch (err) {
    console.error('[Notification Error]', err.message);
  }
};

module.exports = { logAudit, notifyUser };
