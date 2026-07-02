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

// Update timestamp on save
CommentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for replies
CommentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentCommentId',
});

// Method to increment likes
CommentSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

// Method to decrement likes
CommentSchema.methods.decrementLikes = function() {
  this.likes = Math.max(this.likes - 1, 0);
  return this.save();
};

// Method to check if comment has parent
CommentSchema.methods.isReply = function() {
  return !!this.parentCommentId;
};

// Ensure only one content type is set (article, video, or live)
CommentSchema.pre('save', function(next) {
  const types = [this.articleId, this.videoId, this.liveId];
  const hasTypes = types.filter(type => type !== undefined && type !== null);
  if (hasTypes.length !== 1) {
    const error = new Error('Comment must belong to exactly one content type (article, video, or live)');
    next(error);
  } else {
    next();
  }
});

module.exports = mongoose.model('Comment', CommentSchema);