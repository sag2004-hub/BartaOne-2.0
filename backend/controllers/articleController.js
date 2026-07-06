// backend/controllers/articleController.js
const Article = require('../models/Article');
const Channel = require('../models/Channel');
const User = require('../models/User'); // ← ADD THIS - WAS MISSING
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const { sendResponse, sendError } = require('../utils/response'); // ← ADD THIS - WAS MISSING

// Get all articles
exports.getAllArticles = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, channelId, search, sort = '-createdAt' } = req.query;

    const query = {};
    if (category) query.category = category;
    if (channelId) query.channelId = channelId;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
      ];
    }

    const articles = await Article.find(query)
      .populate('channelId', 'channelName logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const total = await Article.countDocuments(query);

    return sendResponse(res, 200, true, 'Articles fetched successfully', {
      articles,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get all articles error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get article by ID
exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id)
      .populate('channelId', 'channelName logo description location');

    if (!article) {
      return sendError(res, 404, 'Article not found');
    }

    // Increment views
    article.views += 1;
    await article.save();

    // Check if user liked the article
    let isLiked = false;
    if (req.user?.uid) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (user) {
        const like = await Like.findOne({
          userId: user._id,
          articleId: article._id,
        });
        isLiked = !!like;
      }
    }

    const articleData = article.toObject();
    articleData.isLiked = isLiked;

    return sendResponse(res, 200, true, 'Article fetched successfully', articleData);
  } catch (error) {
    console.error('Get article by ID error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get articles by channel
exports.getArticlesByChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const articles = await Article.find({ channelId, isPublished: true })
      .populate('channelId', 'channelName logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Article.countDocuments({ channelId, isPublished: true });

    return sendResponse(res, 200, true, 'Channel articles fetched successfully', {
      articles,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get articles by channel error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get articles by category
exports.getArticlesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const articles = await Article.find({ category, isPublished: true })
      .populate('channelId', 'channelName logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Article.countDocuments({ category, isPublished: true });

    return sendResponse(res, 200, true, 'Category articles fetched successfully', {
      articles,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get articles by category error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get trending articles
exports.getTrendingArticles = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const articles = await Article.find({ isPublished: true })
      .populate('channelId', 'channelName logo')
      .sort({ views: -1, likes: -1 })
      .limit(parseInt(limit));

    return sendResponse(res, 200, true, 'Trending articles fetched successfully', articles);
  } catch (error) {
    console.error('Get trending articles error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get latest articles
exports.getLatestArticles = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const articles = await Article.find({ isPublished: true })
      .populate('channelId', 'channelName logo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return sendResponse(res, 200, true, 'Latest articles fetched successfully', articles);
  } catch (error) {
    console.error('Get latest articles error:', error);
    return sendError(res, 500, error.message);
  }
};

// ─── CREATE ARTICLE ──────────────────────────────────────────────────────────
exports.createArticle = async (req, res) => {
  try {
    console.log('📥 Create article request received');
    console.log('📥 Request body:', req.body);
    
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      console.error('❌ No Firebase UID found');
      return sendError(res, 401, 'Unauthorized');
    }

    console.log('👤 Firebase UID:', firebaseUid);

    // Find user
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      console.error('❌ User not found for UID:', firebaseUid);
      return sendError(res, 404, 'User not found');
    }

    console.log('👤 User found:', user._id);

    // Find channel
    const channel = await Channel.findOne({ ownerId: user._id });
    if (!channel) {
      console.error('❌ Channel not found for user:', user._id);
      return sendError(res, 404, 'Channel not found. Please create a channel first.');
    }

    console.log('✅ Channel found:', channel.channelName, 'ID:', channel._id);

    // Extract data from request body
    const { title, body, summary, category, language, image, channelId } = req.body;

    // Validate required fields
    if (!title || !body || !summary) {
      console.error('❌ Missing required fields');
      return sendError(res, 400, 'Title, body, and summary are required');
    }

    // Use channelId from request or from channel object
    // CRITICAL FIX: Use channel._id (MongoDB ID) instead of the Firebase UID
    const finalChannelId = channel._id; // ← USE THIS, NOT channelId from request

    console.log('✅ Using channel ID:', finalChannelId);

    // Create article data
    const articleData = {
      channelId: finalChannelId, // ← Use MongoDB channel ID
      title: title.trim(),
      body: body.trim(),
      summary: summary.trim(),
      category: category || 'news',
      language: language || 'en',
      isPublished: true,
      publishedAt: new Date(),
    };

    // Handle image if provided as base64
    if (image && image.base64) {
      try {
        // In production, you should upload to Cloudinary or other storage
        // For now, we'll save the base64 string
        articleData.image = `data:${image.type || 'image/jpeg'};base64,${image.base64}`;
        console.log('✅ Image added to article (base64 length:', image.base64.length, ')');
      } catch (imgError) {
        console.error('❌ Error processing image:', imgError);
        // Continue without image
      }
    }

    const article = new Article(articleData);
    await article.save();

    console.log('✅ Article created successfully:', article._id);

    return sendResponse(res, 201, true, 'Article created successfully', article);
  } catch (error) {
    console.error('❌ Create article error:', error);
    return sendError(res, 500, error.message || 'Error creating article');
  }
};

// ─── UPDATE ARTICLE ──────────────────────────────────────────────────────────
exports.updateArticle = async (req, res) => {
  try {
    console.log('📥 Update article request received');
    const { id } = req.params;
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const article = await Article.findById(id).populate('channelId');
    if (!article) {
      return sendError(res, 404, 'Article not found');
    }

    // Check if user owns the channel
    if (article.channelId.ownerId.toString() !== user._id.toString()) {
      return sendError(res, 403, 'Unauthorized to update this article');
    }

    const { title, body, summary, category, language, isPublished, image } = req.body;

    if (title) article.title = title.trim();
    if (body) article.body = body.trim();
    if (summary) article.summary = summary.trim();
    if (category) article.category = category;
    if (language) article.language = language;
    if (isPublished !== undefined) article.isPublished = isPublished;

    // Handle image if provided
    if (image && image.base64) {
      article.image = `data:${image.type || 'image/jpeg'};base64,${image.base64}`;
    }

    article.updatedAt = new Date();
    await article.save();

    return sendResponse(res, 200, true, 'Article updated successfully', article);
  } catch (error) {
    console.error('Update article error:', error);
    return sendError(res, 500, error.message);
  }
};

// Delete article
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const article = await Article.findById(id).populate('channelId');
    if (!article) {
      return sendError(res, 404, 'Article not found');
    }

    // Check if user owns the channel
    if (article.channelId.ownerId.toString() !== user._id.toString()) {
      return sendError(res, 403, 'Unauthorized to delete this article');
    }

    await article.deleteOne();

    return sendResponse(res, 200, true, 'Article deleted successfully');
  } catch (error) {
    console.error('Delete article error:', error);
    return sendError(res, 500, error.message);
  }
};

// Like article
exports.likeArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const article = await Article.findById(id);
    if (!article) {
      return sendError(res, 404, 'Article not found');
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      userId: user._id,
      articleId: article._id,
    });

    if (existingLike) {
      return sendError(res, 400, 'Already liked');
    }

    const like = new Like({
      userId: user._id,
      articleId: article._id,
    });
    await like.save();

    article.likes += 1;
    await article.save();

    return sendResponse(res, 200, true, 'Article liked successfully');
  } catch (error) {
    console.error('Like article error:', error);
    return sendError(res, 500, error.message);
  }
};

// Unlike article
exports.unlikeArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const article = await Article.findById(id);
    if (!article) {
      return sendError(res, 404, 'Article not found');
    }

    const like = await Like.findOne({
      userId: user._id,
      articleId: article._id,
    });

    if (!like) {
      return sendError(res, 400, 'Not liked');
    }

    await like.deleteOne();

    article.likes = Math.max(article.likes - 1, 0);
    await article.save();

    return sendResponse(res, 200, true, 'Article unliked successfully');
  } catch (error) {
    console.error('Unlike article error:', error);
    return sendError(res, 500, error.message);
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parentCommentId } = req.body;
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const article = await Article.findById(id);
    if (!article) {
      return sendError(res, 404, 'Article not found');
    }

    const comment = new Comment({
      userId: user._id,
      articleId: article._id,
      content,
      parentCommentId: parentCommentId || null,
    });
    await comment.save();

    // Increment comment count
    article.comments += 1;
    await article.save();

    return sendResponse(res, 201, true, 'Comment added successfully', comment);
  } catch (error) {
    console.error('Add comment error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get comments
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({
      articleId: id,
      parentCommentId: null, // Only top-level comments
    })
      .populate('userId', 'name profilePicture')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Comment.countDocuments({
      articleId: id,
      parentCommentId: null,
    });

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          parentCommentId: comment._id,
        }).populate('userId', 'name profilePicture');
        return {
          ...comment.toObject(),
          replies,
        };
      })
    );

    return sendResponse(res, 200, true, 'Comments fetched successfully', {
      comments: commentsWithReplies,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return sendError(res, 500, error.message);
  }
};

// Search articles
exports.searchArticles = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return sendError(res, 400, 'Search query is required');
    }

    const articles = await Article.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
        { body: { $regex: q, $options: 'i' } },
      ],
      isPublished: true,
    })
      .populate('channelId', 'channelName logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Article.countDocuments({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
        { body: { $regex: q, $options: 'i' } },
      ],
      isPublished: true,
    });

    return sendResponse(res, 200, true, 'Search results fetched successfully', {
      articles,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Search articles error:', error);
    return sendError(res, 500, error.message);
  }
};