// backend/models/Live.js
const mongoose = require('mongoose');

const LiveSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Stream title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: [true, 'Channel ID is required'],
  },
  thumbnail: {
    type: String,
    default: null,
  },
  language: {
    type: String,
    default: 'en',
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled',
  },
  scheduledFor: {
    type: Date,
    default: null,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  endedAt: {
    type: Date,
    default: null,
  },
  viewers: {
    type: Number,
    default: 0,
  },
  maxViewers: {
    type: Number,
    default: 0,
  },
  reactions: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  streamKey: {
    type: String,
    unique: true, // ✅ This creates the index
    default: () => require('crypto').randomBytes(16).toString('hex'),
  },
}, {
  timestamps: true,
});

// ─── Pre-save Middleware ──────────────────────────────────────────────────
LiveSchema.pre('save', function() {
  // If stream is going live and no startedAt, set it
  if (this.status === 'live' && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  // If stream is ending and no endedAt, set it
  if (this.status === 'ended' && !this.endedAt) {
    this.endedAt = new Date();
  }
});

// ─── Indexes ──────────────────────────────────────────────────────────────
// ❌ REMOVED duplicate index - streamKey already has unique: true in schema
// ✅ Keep only these indexes
LiveSchema.index({ channelId: 1, status: 1 });
LiveSchema.index({ scheduledFor: 1 });
LiveSchema.index({ startedAt: -1 });
// ✅ REMOVED: LiveSchema.index({ streamKey: 1 }, { unique: true }); // DUPLICATE!

// ─── Static Methods ──────────────────────────────────────────────────────
LiveSchema.statics.findActiveByChannel = function(channelId) {
  return this.find({
    channelId,
    status: { $in: ['live', 'scheduled'] },
    isActive: true,
  }).sort({ startedAt: -1 });
};

LiveSchema.statics.findLiveStreams = function() {
  return this.find({
    status: 'live',
    isActive: true,
  }).sort({ startedAt: -1 });
};

LiveSchema.statics.findScheduledStreams = function() {
  return this.find({
    status: 'scheduled',
    isActive: true,
    scheduledFor: { $gte: new Date() },
  }).sort({ scheduledFor: 1 });
};

// ─── Instance Methods ────────────────────────────────────────────────────
LiveSchema.methods.start = function() {
  this.status = 'live';
  this.startedAt = new Date();
  this.isActive = true;
  return this.save();
};

LiveSchema.methods.end = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  this.isActive = false;
  return this.save();
};

LiveSchema.methods.addViewer = function() {
  this.viewers += 1;
  if (this.viewers > this.maxViewers) {
    this.maxViewers = this.viewers;
  }
  return this.save();
};

LiveSchema.methods.removeViewer = function() {
  if (this.viewers > 0) {
    this.viewers -= 1;
  }
  return this.save();
};

LiveSchema.methods.addReaction = function() {
  this.reactions += 1;
  return this.save();
};

LiveSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.isActive = false;
  return this.save();
};

// ─── Virtual Fields ──────────────────────────────────────────────────────
LiveSchema.virtual('duration').get(function() {
  if (this.startedAt && this.endedAt) {
    const diff = this.endedAt - this.startedAt;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
  return '0m 0s';
});

LiveSchema.virtual('isLive').get(function() {
  return this.status === 'live' && this.isActive;
});

LiveSchema.virtual('isScheduled').get(function() {
  return this.status === 'scheduled' && this.isActive;
});

// ─── Ensure virtuals are included in JSON output ────────────────────────
LiveSchema.set('toJSON', { virtuals: true });
LiveSchema.set('toObject', { virtuals: true });

const Live = mongoose.model('Live', LiveSchema);

module.exports = Live;