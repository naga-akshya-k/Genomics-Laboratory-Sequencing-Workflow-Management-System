const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateTokenAndSetCookie = (user, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'genomics_super_secret_jwt_key_2026_workflow_mgmt',
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

// @desc Register user
// @route POST /api/v1/auth/register
// @access Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, organization, phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default to requester if not specified or unless created by admin
    const assignedRole = ['admin', 'lab_staff', 'requester'].includes(role)
      ? role
      : 'requester';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: assignedRole,
      organization: organization || '',
      phone: phone || '',
      isActive: true,
    });

    const token = generateTokenAndSetCookie(user, res);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: user,
      token,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Login user
// @route POST /api/v1/auth/login
// @access Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User does not exist.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Contact an administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    const token = generateTokenAndSetCookie(user, res);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: user,
      token,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Logout user / clear cookie
// @route POST /api/v1/auth/logout
// @access Public / Self
const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc Get current logged in user
// @route GET /api/v1/auth/me
// @access Private
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
