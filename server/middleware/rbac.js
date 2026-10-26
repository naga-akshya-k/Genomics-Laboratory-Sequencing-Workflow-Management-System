/**
 * Role-Based Access Control middleware
 * @param {string[]} allowedRoles Array of permitted roles (e.g. ['admin', 'lab_staff'])
 */
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization check.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' lacks permission for this action. Allowed roles: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = { requireRole };
