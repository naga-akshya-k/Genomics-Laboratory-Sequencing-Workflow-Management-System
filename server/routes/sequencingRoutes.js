const express = require('express');
const { body } = require('express-validator');
const {
  getAllRuns,
  createRun,
  getRunById,
  updateRunStatus,
} = require('../controllers/sequencingController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(verifyToken, requireRole(['admin', 'lab_staff']));

router.get('/', getAllRuns);
router.get('/:id', getRunById);

router.post(
  '/',
  [
    body('platform')
      .isIn(['Illumina NovaSeq', 'Illumina MiSeq', 'Oxford Nanopore', 'PacBio'])
      .withMessage('Valid sequencing platform is required'),
    body('runType')
      .isIn(['WGS', 'WES', 'RNA-Seq', 'Targeted Panel'])
      .withMessage('Valid run type is required (WGS, WES, RNA-Seq, Targeted Panel)'),
    validate,
  ],
  createRun
);

router.patch('/:id', updateRunStatus);

module.exports = router;
