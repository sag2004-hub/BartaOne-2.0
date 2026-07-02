const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['viewer', 'owner', 'admin'],
    default: 'viewer',
  },
  phone: {
    type: String,
    trim: true,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  preferredLanguage: {
    type: String,
    default: 'en',
  },
  location: {
    state: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  savedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
  }],
  readingHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
  }],
  preferences: {
    notifications: {
      type: Boolean,
      default: true,
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
    autoPlay: {
      type: Boolean,
      default: true,
    },
    saveData: {
      type: Boolean,
      default: false,
    },
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return this.name;
});

// Method to check if user is owner
UserSchema.methods.isOwner = function() {
  return this.role === 'owner';
};

// Method to check if user is admin
UserSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

module.exports = mongoose.model('User', UserSchema);