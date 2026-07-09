// backend/models/Channel.js - SIMPLIFIED VERSION
const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  channelName: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  logo: {
    type: String,
    default: null,
  },
  banner: {
    type: String,
    default: null,
  },
  language: {
    type: String,
    default: 'en',
  },
  location: {
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    area: { type: String, default: '' },
  },
  category: {
    type: String,
    enum: ['news', 'entertainment', 'sports', 'business', 'technology', 'lifestyle', 'other'],
    default: 'news',
    index: true,
  },
  followers: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  // ─── Use Mongoose timestamps instead of pre('save') ──────────────────────
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  // Ensure virtuals are included
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ─── REMOVED the problematic pre('save') hook ──────────────────────────────
// The timestamps option will handle createdAt and updatedAt automatically

// Methods
ChannelSchema.methods.incrementFollowers = function() {
  this.followers += 1;
  return this.save();
};

ChannelSchema.methods.decrementFollowers = function() {
  this.followers = Math.max(this.followers - 1, 0);
  return this.save();
};

// Virtual for full location
ChannelSchema.virtual('fullLocation').get(function() {
  const parts = [];
  if (this.location?.city) parts.push(this.location.city);
  if (this.location?.district) parts.push(this.location.district);
  if (this.location?.state) parts.push(this.location.state);
  if (this.location?.area) parts.push(this.location.area);
  return parts.join(', ');
});

module.exports = mongoose.model('Channel', ChannelSchema);