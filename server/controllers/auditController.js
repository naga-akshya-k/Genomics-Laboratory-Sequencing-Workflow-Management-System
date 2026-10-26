const AuditLog = require('../models/AuditLog');

// @desc Get system audit logs (Admin only)
// @route GET /api/v1/audit-logs
// @access Private (Admin)
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, action, entityType } = req.query;
    const query = {};

    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)) || 1,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLogs };
