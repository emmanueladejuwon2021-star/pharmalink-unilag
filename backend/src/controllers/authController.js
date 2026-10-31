const User = require('../models/User');
const { generateToken } = require('../utils/token');
const {
  isValidUnilagEmail,
  isValidMatricNumber,
  isValidLevel
} = require('@pharmalink/shared');

/**
 * Register a new UNILAG Pharmacy student account
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { fullName, email, matricNumber, level, password } = req.body;

    // Field existence
    if (!fullName || !email || !matricNumber || !level || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields (fullName, email, matricNumber, level, password) are required.'
      });
    }

    // UNILAG email validation
    if (!isValidUnilagEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Registration is restricted to UNILAG students (@live.unilag.edu.ng or @unilag.edu.ng).'
      });
    }

    // Matriculation format validation
    if (!isValidMatricNumber(matricNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid matriculation number format. Must be a 9-digit UNILAG matric number.'
      });
    }

    // Eligible level check (200L to 500L)
    if (!isValidLevel(level)) {
      return res.status(400).json({
        success: false,
        message: 'PharmaLink is strictly for Faculty of Pharmacy students in 200L, 300L, 400L, or 500L.'
      });
    }

    // Password strength check
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    // Check for existing user with same email
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this UNILAG email address already exists.'
      });
    }

    // Check for existing user with same matric number
    const existingMatric = await User.findOne({ matricNumber: matricNumber.trim() });
    if (existingMatric) {
      return res.status(409).json({
        success: false,
        message: 'An account with this matriculation number already exists.'
      });
    }

    // Create user
    const user = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      matricNumber: matricNumber.trim(),
      level,
      password
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Awaiting student verification.',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log into existing account
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email/matric number and password.'
      });
    }

    const trimmed = identifier.trim();
    const cleanIdentifier = trimmed.toLowerCase();

    // Support logging in via email or matric number
    // Prefer email match if it looks like email, else matric
    const query = isValidUnilagEmail(trimmed)
      ? { email: cleanIdentifier }
      : {
          $or: [
            { email: cleanIdentifier },
            { matricNumber: trimmed }
          ]
        };

    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login credentials.'
      });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
async function getMe(req, res) {
  res.status(200).json({
    success: true,
    user: req.user.toSafeObject()
  });
}

/**
 * Update authenticated user password
 * POST /api/auth/change-password
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both current password and new password are required.'
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  changePassword
};
