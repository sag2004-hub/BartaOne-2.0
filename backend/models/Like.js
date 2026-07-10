// backend/models/Like.js
const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    default: null,
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    default: null,
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ─── Use partialFilterExpression for unique indexes ──────────────────────
// This ensures uniqueness only when the field exists (not null)
LikeSchema.index(
  { userId: 1, articleId: 1 },
  { 
    unique: true, 
    partialFilterExpression: { articleId: { $ne: null } } 
  }
);
LikeSchema.index(
  { userId: 1, videoId: 1 },
  { 
    unique: true, 
    partialFilterExpression: { videoId: { $ne: null } } 
  }
);
LikeSchema.index(
  { userId: 1, commentId: 1 },
  { 
    unique: true, 
    partialFilterExpression: { commentId: { $ne: null } } 
  }
);

// ─── Toggle like on video ──────────────────────────────────────────────
LikeSchema.statics.toggleVideoLike = async function(userId, videoId) {
  try {
    const existingLike = await this.findOne({ userId, videoId });
    
    if (existingLike) {
      await existingLike.deleteOne();
      return { liked: false, action: 'unliked' };
    } else {
      const newLike = new this({ userId, videoId });
      await newLike.save();
      return { liked: true, action: 'liked' };
    }
  } catch (error) {
    console.error('Error toggling video like:', error);
    throw error;
  }
};

// ─── Toggle like on article ─────────────────────────────────────────────
LikeSchema.statics.toggleArticleLike = async function(userId, articleId) {
  try {
    const existingLike = await this.findOne({ userId, articleId });
    
    if (existingLike) {
      await existingLike.deleteOne();
      return { liked: false, action: 'unliked' };
    } else {
      const newLike = new this({ userId, articleId });
      await newLike.save();
      return { liked: true, action: 'liked' };
    }
  } catch (error) {
    console.error('Error toggling article like:', error);
    throw error;
  }
};

// ─── Toggle like on comment ─────────────────────────────────────────────
LikeSchema.statics.toggleCommentLike = async function(userId, commentId) {
  try {
    const existingLike = await this.findOne({ userId, commentId });
    
    if (existingLike) {
      await existingLike.deleteOne();
      return { liked: false, action: 'unliked' };
    } else {
      const newLike = new this({ userId, commentId });
      await newLike.save();
      return { liked: true, action: 'liked' };
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    throw error;
  }
};

// ─── Check if user liked a video ────────────────────────────────────────
LikeSchema.statics.hasLikedVideo = async function(userId, videoId) {
  try {
    const like = await this.findOne({ userId, videoId });
    return !!like;
  } catch (error) {
    console.error('Error checking video like:', error);
    return false;
  }
};

module.exports = mongoose.model('Like', LikeSchema);