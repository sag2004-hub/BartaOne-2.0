const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
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
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can like a specific item only once
LikeSchema.index({ userId: 1, articleId: 1 }, { unique: true, sparse: true });
LikeSchema.index({ userId: 1, videoId: 1 }, { unique: true, sparse: true });
LikeSchema.index({ userId: 1, liveId: 1 }, { unique: true, sparse: true });
LikeSchema.index({ userId: 1, commentId: 1 }, { unique: true, sparse: true });

// Ensure only one content type is set
LikeSchema.pre('save', function(next) {
  const types = [this.articleId, this.videoId, this.liveId, this.commentId];
  const hasTypes = types.filter(type => type !== undefined && type !== null);
  if (hasTypes.length !== 1) {
    const error = new Error('Like must belong to exactly one content type');
    next(error);
  } else {
    next();
  }
});

// Method to get liked content type
LikeSchema.methods.getContentType = function() {
  if (this.articleId) return 'article';
  if (this.videoId) return 'video';
  if (this.liveId) return 'live';
  if (this.commentId) return 'comment';
  return null;
};

// Method to get content ID
LikeSchema.methods.getContentId = function() {
  return this.articleId || this.videoId || this.liveId || this.commentId;
};

module.exports = mongoose.model('Like', LikeSchema);