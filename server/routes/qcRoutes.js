const express = require('express');
const { body } = require('express-validator');
const {
  getAllQCRecords,
  createQCRecord,
  getQCRecordById,
  updateQCRecord,
} = require('../controllers/qcController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');

const router = express.Router();

router.use(verifyToken, requireRole(['admin', 'lab_staff']));

router.get('/', getAllQCRecords);
router.get('/:id', getQCRecordById);

router.post(
  '/',
  [
    body('sampleId').isMongoId().withMessage('Valid sample ID is required'),
    body('concentrationNgUl').isNumeric().withMessage('Concentration (ng/µL) must be a number'),
    body('purity260_280').isNumeric().withMessage('Purity A260/A280 must be a number'),
    body('purity260_230').isNumeric().withMessage('Purity A260/A230 must be a number'),
    body('volumeUl').isNumeric().withMessage('Volume (µL) must be a number'),
    body('result').isIn(['pending', 'pass', 'fail', 'repeat']).withMessage('Valid result status is required'),
    validate,
  ],
  createQCRecord
);

router.patch('/:id', updateQCRecord);

module.exports = router;
