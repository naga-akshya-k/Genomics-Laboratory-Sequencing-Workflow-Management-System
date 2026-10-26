const express = require('express');
const { body } = require('express-validator');
const {
  getAllAnalysis,
  createAnalysis,
  getAnalysisById,
  updateAnalysis,
} = require('../controllers/analysisController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(verifyToken, requireRole(['admin', 'lab_staff']));

router.get('/', getAllAnalysis);
router.get('/:id', getAnalysisById);

router.post(
  '/',
  upload.single('resultFile'),
  [
    body('sampleId').isMongoId().withMessage('Valid sample ID is required'),
    body('pipeline').notEmpty().withMessage('Bioinformatics pipeline name is required'),
    validate,
  ],
  createAnalysis
);

router.patch('/:id', upload.single('resultFile'), updateAnalysis);

module.exports = router;
