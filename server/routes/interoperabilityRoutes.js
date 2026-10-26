const express = require('express');
const {
  importInstrumentData,
  exportFhirReport,
  getWorkflowAnalytics,
} = require('../controllers/interoperabilityController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.use(verifyToken);

// Instrument import (Staff & Admin)
router.post('/instrument-import', requireRole(['admin', 'lab_staff']), importInstrumentData);

// HL7 FHIR Genomics JSON Export (All authenticated users for their permitted records)
router.get('/fhir/reports/:id', exportFhirReport);

// Turnaround Time & SLA Analytics (Admin & Staff)
router.get('/analytics/tat', requireRole(['admin', 'lab_staff']), getWorkflowAnalytics);

module.exports = router;
