// backend/models/Like.js
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

// Ensure unique like per user per content type
LikeSchema.index({ userId: 1, articleId: 1 }, { unique: true, sparse: true });
LikeSchema.index({ userId: 1, videoId: 1 }, { unique: true, sparse: true });
LikeSchema.index({ userId: 1, commentId: 1 }, { unique: true, sparse: true });

// ─── Static Methods ──────────────────────────────────────────────────────

// Toggle like on article
LikeSchema.statics.toggleArticleLike = async function(userId, articleId) {
  try {
    const existingLike = await this.findOne({ userId, articleId });
    
    if (existingLike) {
      // Unlike - remove the like
      await existingLike.deleteOne();
      return { liked: false, action: 'unliked' };
    } else {
      // Like - create new like
      const newLike = new this({ userId, articleId });
      await newLike.save();
      return { liked: true, action: 'liked' };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

// Check if user liked a specific article
LikeSchema.statics.hasLikedArticle = async function(userId, articleId) {
  try {
    const like = await this.findOne({ userId, articleId });
    return !!like;
  } catch (error) {
    console.error('Error checking like:', error);
    return false;
  }
};

// Get all article likes for a user
LikeSchema.statics.getUserArticleLikes = async function(userId) {
  try {
    const likes = await this.find({ 
      userId, 
      articleId: { $ne: null } 
    }).select('articleId').lean();
    return likes.map(like => like.articleId.toString());
  } catch (error) {
    console.error('Error getting user likes:', error);
    return [];
  }
};

module.exports = mongoose.model('Like', LikeSchema);