const { verifyToken } = require('../utils/token');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing or invalid Authorization header.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token.'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient privileges for this action.'
      });
    }

    next();
  };
}

function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  if (req.user.verificationStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to verified UNILAG Pharmacy students.'
    });
  }

  next();
}

module.exports = {
  requireAuth,
  requireRole,
  requireVerified
};
