const Video = require('../models/Video');
const Channel = require('../models/Channel');
const User = require('../models/User');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const { sendResponse, sendError } = require('../utils/response');
const { uploadToCloudinary } = require('../services/cloudinaryService');

// Get all videos
exports.getAllVideos = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, channelId, search, sort = '-createdAt' } = req.query;

    const query = {};
    if (category) query.category = category;
    if (channelId) query.channelId = channelId;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const videos = await Video.find(query)
      .populate('channelId', 'channelName logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const total = await Video.countDocuments(query);

    return sendResponse(res, 200, true, 'Videos fetched successfully', {
      videos,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get all videos error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get video by ID
exports.getVideoById = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id)
      .populate('channelId', 'channelName logo description location');

    if (!video) {
      return sendError(res, 404, 'Video not found');
    }

    // Increment views
    video.views += 1;
    await video.save();

    // Check if user liked the video
    let isLiked = false;
    if (req.user?.uid) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (user) {
        const like = await Like.findOne({
          userId: user._id,
          videoId: video._id,
        });
        isLiked = !!like;
      }
    }

    const videoData = video.toObject();
    videoData.isLiked = isLiked;

    return sendResponse(res, 200, true, 'Video fetched successfully', videoData);
  } catch (error) {
    console.error('Get video by ID error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get videos by channel
exports.getVideosByChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const videos = await Video.find({ channelId })
      .populate('channelId', 'channelName logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Video.countDocuments({ channelId });

    return sendResponse(res, 200, true, 'Channel videos fetched successfully', {
      videos,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get videos by channel error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get videos by category
exports.getVideosByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const videos = await Video.find({ category })
      .populate('channelId', 'channelName logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Video.countDocuments({ category });

    return sendResponse(res, 200, true, 'Category videos fetched successfully', {
      videos,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get videos by category error:', error);
    return sendError(res, 500, error.message);
  }
};

// Upload video
exports.uploadVideo = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const channel = await Channel.findOne({ ownerId: user._id });
    if (!channel) {
      return sendError(res, 404, 'Channel not found');
    }

    const { title, description, category, language } = req.body;

    // Upload video
    let videoUrl = null;
    let thumbnailUrl = null;

    if (req.files && req.files.video) {
      const result = await uploadToCloudinary(req.files.video[0].buffer, 'videos', {
        resource_type: 'video',
      });
      videoUrl = result.secure_url;
    }

    // Upload thumbnail if provided
    if (req.files && req.files.thumbnail) {
      const result = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'videos/thumbnails');
      thumbnailUrl = result.secure_url;
    }

    if (!videoUrl) {
      return sendError(res, 400, 'Video file is required');
    }

    const video = new Video({
      channelId: channel._id,
      title,
      description,
      videoUrl,
      thumbnail: thumbnailUrl,
      category: category || 'news',
      language: language || 'en',
    });

    await video.save();

    return sendResponse(res, 201, true, 'Video uploaded successfully', video);
  } catch (error) {
    console.error('Upload video error:', error);
    return sendError(res, 500, error.message);
  }
};

// Update video
exports.updateVideo = async (req, res) => {
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

    const video = await Video.findById(id).populate('channelId');
    if (!video) {
      return sendError(res, 404, 'Video not found');
    }

    // Check if user owns the channel
    if (video.channelId.ownerId.toString() !== user._id.toString()) {
      return sendError(res, 403, 'Unauthorized to update this video');
    }

    const { title, description, category, language, isPublished } = req.body;

    if (title) video.title = title;
    if (description) video.description = description;
    if (category) video.category = category;
    if (language) video.language = language;
    if (isPublished !== undefined) video.isPublished = isPublished;

    // Upload thumbnail if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'videos/thumbnails');
      video.thumbnail = result.secure_url;
    }

    video.updatedAt = new Date();
    await video.save();

    return sendResponse(res, 200, true, 'Video updated successfully', video);
  } catch (error) {
    console.error('Update video error:', error);
    return sendError(res, 500, error.message);
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
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

    const video = await Video.findById(id).populate('channelId');
    if (!video) {
      return sendError(res, 404, 'Video not found');
    }

    // Check if user owns the channel
    if (video.channelId.ownerId.toString() !== user._id.toString()) {
      return sendError(res, 403, 'Unauthorized to delete this video');
    }

    await video.deleteOne();

    return sendResponse(res, 200, true, 'Video deleted successfully');
  } catch (error) {
    console.error('Delete video error:', error);
    return sendError(res, 500, error.message);
  }
};

// Like video
exports.likeVideo = async (req, res) => {
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

    const video = await Video.findById(id);
    if (!video) {
      return sendError(res, 404, 'Video not found');
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      userId: user._id,
      videoId: video._id,
    });

    if (existingLike) {
      return sendError(res, 400, 'Already liked');
    }

    const like = new Like({
      userId: user._id,
      videoId: video._id,
    });
    await like.save();

    video.likes += 1;
    await video.save();

    return sendResponse(res, 200, true, 'Video liked successfully');
  } catch (error) {
    console.error('Like video error:', error);
    return sendError(res, 500, error.message);
  }
};

// Unlike video
exports.unlikeVideo = async (req, res) => {
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

    const video = await Video.findById(id);
    if (!video) {
      return sendError(res, 404, 'Video not found');
    }

    const like = await Like.findOne({
      userId: user._id,
      videoId: video._id,
    });

    if (!like) {
      return sendError(res, 400, 'Not liked');
    }

    await like.deleteOne();

    video.likes = Math.max(video.likes - 1, 0);
    await video.save();

    return sendResponse(res, 200, true, 'Video unliked successfully');
  } catch (error) {
    console.error('Unlike video error:', error);
    return sendError(res, 500, error.message);
  }
};

// Add comment to video
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

    const video = await Video.findById(id);
    if (!video) {
      return sendError(res, 404, 'Video not found');
    }

    const comment = new Comment({
      userId: user._id,
      videoId: video._id,
      content,
      parentCommentId: parentCommentId || null,
    });
    await comment.save();

    // Increment comment count
    video.comments += 1;
    await video.save();

    return sendResponse(res, 201, true, 'Comment added successfully', comment);
  } catch (error) {
    console.error('Add comment error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get video comments
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({
      videoId: id,
      parentCommentId: null,
    })
      .populate('userId', 'name profilePicture')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Comment.countDocuments({
      videoId: id,
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