// backend/models/Article.js
const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  summary: {
    type: String,
    trim: true,
  },
  body: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  language: {
    type: String,
    default: 'en',
    index: true,
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true,
  },
  image: {
    type: String,
  },
  tags: [{
    type: String,
    index: true,
  }],
  likes: {
    type: Number,
    default: 0,
  },
  views: {
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
    index: true,
  },
  publishedAt: {
    type: Date,
    default: Date.now,
    index: true,
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
  timestamps: true,
});

// ─── FIX: Remove next() from pre-save middleware ─────────────────────────
ArticleSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// ─── Methods ──────────────────────────────────────────────────────────────
ArticleSchema.methods.incrementLikes = async function() {
  this.likes = (this.likes || 0) + 1;
  return this.save();
};

ArticleSchema.methods.decrementLikes = async function() {
  this.likes = Math.max((this.likes || 0) - 1, 0);
  return this.save();
};

ArticleSchema.methods.incrementViews = async function() {
  this.views = (this.views || 0) + 1;
  return this.save();
};

ArticleSchema.methods.incrementComments = async function() {
  this.comments = (this.comments || 0) + 1;
  return this.save();
};

ArticleSchema.methods.decrementComments = async function() {
  this.comments = Math.max((this.comments || 0) - 1, 0);
  return this.save();
};

module.exports = mongoose.model('Article', ArticleSchema);