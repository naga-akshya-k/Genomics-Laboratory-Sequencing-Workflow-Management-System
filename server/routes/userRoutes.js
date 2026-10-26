const express = require('express');
const { body } = require('express-validator');
const {
  getAllUsers,
  createUser,
  updateUser,
  deactivateUser,
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Admin only for all user management endpoints
router.use(verifyToken, requireRole(['admin']));

router.get('/', getAllUsers);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').isIn(['admin', 'lab_staff', 'requester']).withMessage('Role must be admin, lab_staff, or requester'),
    validate,
  ],
  createUser
);

router.patch('/:id', updateUser);
router.patch('/:id/deactivate', deactivateUser);

module.exports = router;
