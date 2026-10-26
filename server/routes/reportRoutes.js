const express = require('express');
const { body } = require('express-validator');
const {
  getAllReports,
  generateReport,
  getReportById,
  downloadReport,
  deliverReport,
} = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(verifyToken);

// List reports (role-scoped in controller)
router.get('/', getAllReports);

// Generate report (staff/admin)
router.post(
  '/generate',
  requireRole(['admin', 'lab_staff']),
  [
    body('requestId').isMongoId().withMessage('Valid request ID is required'),
    body('sampleId').isMongoId().withMessage('Valid sample ID is required'),
    validate,
  ],
  generateReport
);

// Get single report
router.get('/:id', getReportById);

// Download PDF (checks role/ownership)
router.get('/:id/download', downloadReport);

// Deliver report (staff/admin)
router.patch('/:id/deliver', requireRole(['admin', 'lab_staff']), deliverReport);

module.exports = router;
