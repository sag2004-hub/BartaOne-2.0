// backend/models/Comment.js - Minimal fixed version
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    index: true,
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    index: true,
  },
  liveId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Live',
    index: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
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

// ─── SIMPLIFIED FIX: Remove pre-save middleware and use a function ──────
CommentSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// ─── SIMPLIFIED FIX: Validate content type without next() ──────────────
CommentSchema.pre('save', function() {
  const types = [this.articleId, this.videoId, this.liveId];
  const hasTypes = types.filter(type => type !== undefined && type !== null);
  if (hasTypes.length !== 1) {
    throw new Error('Comment must belong to exactly one content type (article, video, or live)');
  }
});

// Virtual for replies
CommentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentCommentId',
});

// Method to increment likes
CommentSchema.methods.incrementLikes = async function() {
  this.likes += 1;
  return this.save();
};

// Method to decrement likes
CommentSchema.methods.decrementLikes = async function() {
  this.likes = Math.max(this.likes - 1, 0);
  return this.save();
};

// Method to check if comment has parent
CommentSchema.methods.isReply = function() {
  return !!this.parentCommentId;
};

module.exports = mongoose.model('Comment', CommentSchema);