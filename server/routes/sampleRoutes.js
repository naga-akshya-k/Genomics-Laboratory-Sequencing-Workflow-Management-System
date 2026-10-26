const express = require('express');
const { body } = require('express-validator');
const {
  getAllSamples,
  createSample,
  getSampleById,
  updateSampleStage,
} = require('../controllers/sampleController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(verifyToken);

// All roles can list/view (requester gets their own)
router.get('/', getAllSamples);
router.get('/:id', getSampleById);

// Staff and admin write
router.post(
  '/',
  requireRole(['admin', 'lab_staff']),
  [
    body('requestId').isMongoId().withMessage('Valid request ID is required'),
    validate,
  ],
  createSample
);

router.patch(
  '/:id/stage',
  requireRole(['admin', 'lab_staff']),
  [
    body('currentStage')
      .isIn(['registered', 'qc', 'sequencing', 'analysis', 'report_ready', 'delivered'])
      .withMessage('Valid sample stage is required'),
    validate,
  ],
  updateSampleStage
);

module.exports = router;
