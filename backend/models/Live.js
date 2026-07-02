const mongoose = require('mongoose');

const LiveSchema = new mongoose.Schema({
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
  },
  description: {
    type: String,
    trim: true,
  },
  streamUrl: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    default: null,
  },
  language: {
    type: String,
    default: 'en',
  },
  viewers: {
    type: Number,
    default: 0,
  },
  isLive: {
    type: Boolean,
    default: true,
    index: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
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
LiveSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to start stream
LiveSchema.methods.startStream = function() {
  this.isLive = true;
  this.startedAt = new Date();
  return this.save();
};

// Method to end stream
LiveSchema.methods.endStream = function() {
  this.isLive = false;
  this.endedAt = new Date();
  return this.save();
};

// Method to increment viewers
LiveSchema.methods.incrementViewers = function() {
  this.viewers += 1;
  return this.save();
};

// Method to decrement viewers
LiveSchema.methods.decrementViewers = function() {
  this.viewers = Math.max(this.viewers - 1, 0);
  return this.save();
};

// Method to get stream duration
LiveSchema.methods.getDuration = function() {
  if (!this.startedAt) return '0:00';
  const end = this.endedAt || new Date();
  const duration = Math.floor((end - this.startedAt) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

module.exports = mongoose.model('Live', LiveSchema);