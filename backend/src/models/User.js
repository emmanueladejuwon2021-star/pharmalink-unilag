const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  ELIGIBLE_LEVELS,
  USER_ROLES,
  VERIFICATION_STATUS,
  isValidUnilagEmail,
  isValidMatricNumber
} = require('@pharmalink/shared');

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

const User = mongoose.model('User', userSchema);

module.exports = User;
