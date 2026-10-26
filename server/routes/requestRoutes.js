const express = require('express');
const { body } = require('express-validator');
const {
  getAllRequests,
  createRequest,
  getRequestById,
  updateRequestStatus,
} = require('../controllers/requestController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(verifyToken);

router.get('/', getAllRequests);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Request title is required'),
    body('sampleType')
      .isIn(['DNA', 'RNA', 'Blood', 'Tissue', 'Other'])
      .withMessage('Valid sample type is required (DNA, RNA, Blood, Tissue, Other)'),
    body('priority').optional().isIn(['routine', 'urgent']),
    validate,
  ],
  createRequest
);

router.get('/:id', getRequestById);

router.patch(
  '/:id/status',
  requireRole(['admin', 'lab_staff']),
  [
    body('status')
      .isIn(['submitted', 'under_review', 'approved', 'rejected', 'in_progress', 'completed'])
      .withMessage('Valid status is required'),
    validate,
  ],
  updateRequestStatus
);

module.exports = router;
