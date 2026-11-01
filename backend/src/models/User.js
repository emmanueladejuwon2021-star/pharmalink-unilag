const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  ELIGIBLE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  DEPARTMENTS,
  isValidUnilagEmail,
  isValidMatricNumber
} = require('@pharmalink/shared');

const deptCodes = DEPARTMENTS ? DEPARTMENTS.map((d) => d.code) : ['CPH', 'PCH', 'PCT', 'PCG', 'PCL'];

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters']
    },
    email: {
      type: String,
      required: [true, 'UNILAG email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: isValidUnilagEmail,
        message: 'Must be a valid UNILAG email (@live.unilag.edu.ng or @unilag.edu.ng)'
      }
    },
    matricNumber: {
      type: String,
      required: [true, 'Matriculation number is required'],
      unique: true,
      trim: true,
      validate: {
        validator: isValidMatricNumber,
        message: 'Matriculation number must be exactly 9 digits'
      }
    },
    level: {
      type: String,
      required: [true, 'Academic level is required'],
      enum: {
        values: ELIGIBLE_LEVELS,
        message: 'Level must be one of: 200L, 300L, 400L, 500L'
      }
    },
    department: {
      type: String,
      enum: {
        values: [...deptCodes, null, ''],
        message: `Department must be one of: ${deptCodes.join(', ')}`
      },
      default: null
    },
    bio: {
      type: String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      trim: true,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    interests: {
      type: [String],
      default: []
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    socialLinks: {
      linkedin: { type: String, trim: true, default: '' },
      twitter: { type: String, trim: true, default: '' },
      github: { type: String, trim: true, default: '' }
    },
    stats: {
      postsCount: { type: Number, default: 0 },
      materialsCount: { type: Number, default: 0 },
      reputationPoints: { type: Number, default: 10 }
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.STUDENT
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.UNVERIFIED
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe JSON transform: omit password
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Public profile representation (for other students browsing directory)
userSchema.methods.toPublicProfile = function () {
  return {
    _id: this._id,
    fullName: this.fullName,
    matricNumber: this.matricNumber,
    level: this.level,
    department: this.department,
    bio: this.bio || '',
    avatar: this.avatar || '',
    interests: this.interests || [],
    stats: this.stats || { postsCount: 0, materialsCount: 0, reputationPoints: 10 },
    role: this.role,
    verificationStatus: this.verificationStatus,
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
