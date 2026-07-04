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
    unique: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  logo: {
    type: String,
    required: true,
    default: 'https://via.placeholder.com/100',
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
  category: {
    type: String,
    enum: ['news', 'entertainment', 'sports', 'business', 'technology', 'lifestyle', 'other'],
    default: 'news',
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
ChannelSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

// Virtual for full location
ChannelSchema.virtual('fullLocation').get(function() {
  const parts = [];
  if (this.location.city) parts.push(this.location.city);
  if (this.location.district) parts.push(this.location.district);
  if (this.location.state) parts.push(this.location.state);
  if (this.location.area) parts.push(this.location.area);
  return parts.join(', ');
});

// Method to increment followers
ChannelSchema.methods.incrementFollowers = function() {
  this.followers += 1;
  return this.save();
};

// Method to decrement followers
ChannelSchema.methods.decrementFollowers = function() {
  this.followers = Math.max(this.followers - 1, 0);
  return this.save();
};

module.exports = mongoose.model('Channel', ChannelSchema);