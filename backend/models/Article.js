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
});

// Update timestamp on save
ArticleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for reading time (approx 200 words per minute)
ArticleSchema.virtual('readingTime').get(function() {
  const wordCount = this.body.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 200);
  return minutes;
});

// Method to increment views
ArticleSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment likes
ArticleSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

// Method to decrement likes
ArticleSchema.methods.decrementLikes = function() {
  this.likes = Math.max(this.likes - 1, 0);
  return this.save();
};

// Method to increment comments
ArticleSchema.methods.incrementComments = function() {
  this.comments += 1;
  return this.save();
};

// Method to decrement comments
ArticleSchema.methods.decrementComments = function() {
  this.comments = Math.max(this.comments - 1, 0);
  return this.save();
};

module.exports = mongoose.model('Article', ArticleSchema);