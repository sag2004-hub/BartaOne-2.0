const mongoose = require('mongoose');

const newspaperPageSchema = new mongoose.Schema({
  pageNumber: {
    type: Number,
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  images: {
    type: [String],
    default: [],
  },
  layout: {
    type: String,
    enum: ['full', 'split', 'grid'],
    default: 'full',
  },
});

const newspaperSchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  edition: {
    type: String,
    trim: true,
  },
  date: {
    type: String,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000000000,
  },
  pages: [newspaperPageSchema],
  // ✅ Changed from 'language' to 'lang' to avoid MongoDB reserved keyword conflict
  lang: {
    type: String,
    default: 'en',
  },
  region: {
    type: String,
    default: 'global',
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'draft'],
    default: 'active',
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  shares: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// ✅ Fixed: Use a different name for text index to avoid 'language' conflict
// Remove the text index on language since it's causing issues
newspaperSchema.index({ channelId: 1, publishedAt: -1 });
newspaperSchema.index({ expiresAt: 1 });
newspaperSchema.index({ status: 1 });
// ✅ Only index title and description for text search, not language
newspaperSchema.index({ title: 'text', description: 'text' });

// Method to check if newspaper is expired
newspaperSchema.methods.isExpired = function() {
  return new Date() >= this.expiresAt;
};

// Static method to get active newspapers
newspaperSchema.statics.getActive = function() {
  return this.find({
    status: 'active',
    expiresAt: { $gt: new Date() },
  });
};

// Static method to get expired newspapers
newspaperSchema.statics.getExpired = function() {
  return this.find({
    $or: [
      { status: 'expired' },
      { expiresAt: { $lte: new Date() } },
    ],
  });
};

// Method to increment views
newspaperSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('Newspaper', newspaperSchema);