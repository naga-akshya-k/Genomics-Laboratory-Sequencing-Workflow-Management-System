const express = require('express');
const { getAuditLogs } = require('../controllers/auditController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.use(verifyToken, requireRole(['admin']));

router.get('/', getAuditLogs);

module.exports = router;
