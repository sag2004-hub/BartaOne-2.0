// backend/models/Video.js
const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    trim: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    default: null,
  },
  duration: {
    type: String,
    default: '0:00',
  },
  category: {
    type: String,
    enum: ['news', 'entertainment', 'sports', 'business', 'technology', 'lifestyle', 'other'],
    default: 'sports',
    index: true,
  },
  language: {
    type: String,
    default: 'en',
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true,
  },
  isChildFriendly: {
    type: Boolean,
    default: true,
  },
  publishedAt: {
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
}, {
  // ─── Use timestamps option instead of pre('save') hook ──────────────────
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },
  // Ensure virtuals are included in JSON output
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ─── REMOVED the problematic pre('save') hook ──────────────────────────────
// The timestamps option will handle updatedAt automatically

// ─── Virtual for duration formatting ──────────────────────────────────────
VideoSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return '0:00';
  return this.duration;
});

// ─── Methods ──────────────────────────────────────────────────────────────
VideoSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

VideoSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

VideoSchema.methods.decrementLikes = function() {
  this.likes = Math.max(this.likes - 1, 0);
  return this.save();
};

VideoSchema.methods.incrementComments = function() {
  this.comments += 1;
  return this.save();
};

VideoSchema.methods.decrementComments = function() {
  this.comments = Math.max(this.comments - 1, 0);
  return this.save();
};

module.exports = mongoose.model('Video', VideoSchema);