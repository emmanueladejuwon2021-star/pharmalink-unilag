const mongoose = require('mongoose');
const User = require('../models/User');
const AcademicPeriod = require('../models/AcademicPeriod');
const {
  ELIGIBLE_LEVELS,
  PROFILE_INTEREST_AREAS,
  PROFILE_BIO_MAX_LENGTH,
  isValidInterestList,
  isValidGraduatingYear,
  computeProfileCompleteness,
  isProfileViewable
} = require('@pharmalink/shared');

/**
 * EPIC-005: User Profiles and Identity
 * Server-side validation and authorization on every handler. Private
 * community boundary: profile details are only viewable by verified
 * members (or the profile owner themself).
 */

function isValidObjectId(value) {
  return mongoose.isValidObjectId(value);
}

// Build the public representation of a student profile.
function toProfileJSON(user, viewer) {
  const canSeeDetails = isProfileViewable(viewer, user);
  const base = {
    _id: user._id,
    fullName: user.fullName,
    level: user.level,
    role: user.role,
    verificationStatus: user.verificationStatus,
    memberSince: user.createdAt
  };

  if (!canSeeDetails) {
    // Unverified viewers may not browse private member profiles.
    return { ...base, restricted: true };
  }

  return {
    ...base,
    restricted: false,
    bio: user.bio || '',
    interests: user.interests || [],
    graduatingYear: user.graduatingYear || null,
    profileVisibility: user.profileVisibility,
    matricNumberMasked: `${user.matricNumber.slice(0, 3)}••••${user.matricNumber.slice(-2)}`,
    completeness: computeProfileCompleteness(user.toObject())
  };
}

// GET /api/profiles/me — full own profile regardless of verification status
async function getMyProfile(req, res, next) {
  try {
    const profile = toProfileJSON(req.user, req.user);
    let academic = null;
    const period = await AcademicPeriod.findOne({ user: req.user._id });
    if (period) {
      academic = {
        session: period.session,
        semester: period.semester,
        currentLevel: period.currentLevel
      };
    }
    res.json({ success: true, profile, academic });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/profiles/me — update own profile fields with server validation
async function updateMyProfile(req, res, next) {
  try {
    const updates = req.body || {};
    const allowed = ['bio', 'interests', 'graduatingYear', 'profileVisibility'];
    const unknown = Object.keys(updates).filter((k) => !allowed.includes(k));
    if (unknown.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Fields cannot be updated here: ${unknown.join(', ')}. Use the dedicated endpoints for identity, level, or password changes.`
      });
    }

    const user = await User.findById(req.user._id);

    if (updates.bio !== undefined) {
      if (typeof updates.bio !== 'string') {
        return res.status(400).json({ success: false, message: 'Bio must be text.' });
      }
      const bio = updates.bio.trim();
      if (bio.length > PROFILE_BIO_MAX_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Bio must be ${PROFILE_BIO_MAX_LENGTH} characters or fewer.`
        });
      }
      user.bio = bio;
    }

    if (updates.interests !== undefined) {
      if (!Array.isArray(updates.interests) || !isValidInterestList(updates.interests)) {
        return res.status(400).json({
          success: false,
          message: `Interests must be an array drawn from: ${PROFILE_INTEREST_AREAS.join(', ')}.`
        });
      }
      // De-duplicate while preserving order
      user.interests = [...new Set(updates.interests)];
    }

    if (updates.graduatingYear !== undefined) {
      if (updates.graduatingYear === null || updates.graduatingYear === '') {
        user.graduatingYear = undefined;
      } else if (!isValidGraduatingYear(updates.graduatingYear)) {
        return res.status(400).json({
          success: false,
          message: 'Expected graduation year must be a whole number between 2025 and 2035.'
        });
      } else {
        user.graduatingYear = Number(updates.graduatingYear);
      }
    }

    if (updates.profileVisibility !== undefined) {
      if (!['public', 'verified-only'].includes(updates.profileVisibility)) {
        return res.status(400).json({
          success: false,
          message: "Profile visibility must be 'public' or 'verified-only'."
        });
      }
      user.profileVisibility = updates.profileVisibility;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: toProfileJSON(user, user)
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/profiles — directory of students (verified members only)
async function listProfiles(req, res, next) {
  try {
    const { level, search } = req.query;

    const filter = {};
    if (level) {
      if (!ELIGIBLE_LEVELS.includes(level)) {
        return res.status(400).json({
          success: false,
          message: 'Level filter must be one of: 200L, 300L, 400L, 500L'
        });
      }
      filter.level = level;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.fullName = new RegExp(safeSearch, 'i');
    }

    const users = await User.find(filter)
      .sort({ level: 1, fullName: 1 })
      .limit(100);

    res.json({
      success: true,
      count: users.length,
      profiles: users.map((u) => toProfileJSON(u, req.user))
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/profiles/:id — single profile (verified members or owner)
async function getProfileById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid profile identifier.' });
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    if (!isProfileViewable(req.user, target)) {
      return res.status(403).json({
        success: false,
        message: 'Member profiles are restricted to verified UNILAG Pharmacy students.'
      });
    }

    res.json({ success: true, profile: toProfileJSON(target, req.user) });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  listProfiles,
  getProfileById,
  toProfileJSON
};
