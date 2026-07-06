// backend/models/Article.js - SIMPLIFIED VERSION
const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
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
  body: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    enum: ['news', 'entertainment', 'sports', 'business', 'technology', 'lifestyle', 'other'],
    default: 'news',
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
  isFeatured: {
    type: Boolean,
    default: false,
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
  // Enable timestamps with custom names
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },
  // Ensure virtuals are included
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ─── REMOVED the problematic pre('save') hook ─────────────────────────────
// The timestamps option will handle updatedAt automatically

// ─── Virtual for reading time ─────────────────────────────────────────────
ArticleSchema.virtual('readingTime').get(function() {
  if (!this.body) return 0;
  const wordCount = this.body.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 200);
  return minutes || 1;
});

// ─── Methods ──────────────────────────────────────────────────────────────
ArticleSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

ArticleSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

ArticleSchema.methods.decrementLikes = function() {
  this.likes = Math.max(this.likes - 1, 0);
  return this.save();
};

ArticleSchema.methods.incrementComments = function() {
  this.comments += 1;
  return this.save();
};

ArticleSchema.methods.decrementComments = function() {
  this.comments = Math.max(this.comments - 1, 0);
  return this.save();
};

module.exports = mongoose.model('Article', ArticleSchema);