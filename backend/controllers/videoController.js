// backend/controllers/videoController.js
const Video = require('../models/Video');
const Channel = require('../models/Channel');
const User = require('../models/User');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const { sendResponse, sendError } = require('../utils/response');
const cloudinaryService = require('../services/cloudinaryService');

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
    console.error('❌ Get all videos error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get video by ID
exports.getVideoById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📡 [getVideoById] Fetching video:', id);
    console.log('📡 [getVideoById] User:', req.user?.uid || 'Anonymous');

    const video = await Video.findById(id)
      .populate('channelId', 'channelName logo description location');

    if (!video) {
      console.log('❌ [getVideoById] Video not found:', id);
      return sendError(res, 404, 'Video not found');
    }

    // Increment views
    video.views += 1;
    await video.save();

    // ─── Get actual likes count from database ──────────────────────────────
    const actualLikesCount = await Like.countDocuments({ videoId: video._id });
    console.log('📊 [getVideoById] Actual likes count from DB:', actualLikesCount);
    
    // Fix inconsistent likes count
    if (video.likes !== actualLikesCount) {
      console.log('🔄 [getVideoById] Fixing inconsistent likes count...');
      video.likes = actualLikesCount;
      await video.save();
      console.log('✅ [getVideoById] Likes count fixed to:', video.likes);
    }

    // ─── Check if user liked the video ──────────────────────────────
    let isLiked = false;
    const firebaseUid = req.user?.uid;
    
    if (firebaseUid) {
      try {
        const user = await User.findOne({ firebaseUid });
        if (user) {
          const like = await Like.findOne({
            userId: user._id,
            videoId: video._id,
          });
          isLiked = !!like;
          console.log('❤️ [getVideoById] Like found:', isLiked ? 'YES ✅' : 'NO ❌');
        }
      } catch (likeError) {
        console.error('❌ [getVideoById] Error checking like:', likeError);
      }
    }

    const videoData = video.toObject();
    videoData.isLiked = isLiked;
    videoData.likes = video.likes || 0;

    console.log('📤 [getVideoById] Returning - isLiked:', isLiked, 'likes:', videoData.likes);

    return sendResponse(res, 200, true, 'Video fetched successfully', videoData);
  } catch (error) {
    console.error('❌ Get video by ID error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get videos by channel
exports.getVideosByChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const videos = await Video.find({ channelId, isPublished: true })
      .populate('channelId', 'channelName logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Video.countDocuments({ channelId, isPublished: true });

    return sendResponse(res, 200, true, 'Channel videos fetched successfully', {
      videos,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('❌ Get videos by channel error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get videos by category
exports.getVideosByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const videos = await Video.find({ category, isPublished: true })
      .populate('channelId', 'channelName logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Video.countDocuments({ category, isPublished: true });

    return sendResponse(res, 200, true, 'Category videos fetched successfully', {
      videos,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('❌ Get videos by category error:', error);
    return sendError(res, 500, error.message);
  }
};

// ─── UPLOAD VIDEO ────────────────────────────────────────────────────────────
exports.uploadVideo = async (req, res) => {
  try {
    console.log('📥 Upload video request received');
    console.log('📥 Request body:', req.body);
    console.log('📥 Request files:', req.files);
    
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      console.error('❌ No Firebase UID found');
      return sendError(res, 401, 'Unauthorized');
    }

    console.log('👤 Firebase UID:', firebaseUid);

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      console.error('❌ User not found');
      return sendError(res, 404, 'User not found');
    }

    console.log('👤 User found:', user._id);

    const channel = await Channel.findOne({ ownerId: user._id });
    if (!channel) {
      console.error('❌ Channel not found');
      return sendError(res, 404, 'Channel not found. Please create a channel first.');
    }

    console.log('✅ Channel found:', channel.channelName, 'ID:', channel._id);

    const { title, description, category, language, isChildFriendly } = req.body;

    if (!title || !title.trim()) {
      console.error('❌ Missing title');
      return sendError(res, 400, 'Title is required');
    }

    let videoUrl = null;
    let thumbnailUrl = null;

    if (req.files && req.files.video && req.files.video.length > 0) {
      const videoFile = req.files.video[0];
      console.log('📤 Uploading video to Cloudinary...', videoFile.originalname);
      console.log('📤 Video size:', videoFile.size, 'bytes');
      
      const result = await cloudinaryService.uploadVideo(
        videoFile.buffer,
        `channels/${channel._id}/videos`
      );
      videoUrl = result.secure_url;
      console.log('✅ Video uploaded to Cloudinary:', videoUrl);
    }

    if (req.files && req.files.thumbnail && req.files.thumbnail.length > 0) {
      const thumbnailFile = req.files.thumbnail[0];
      console.log('📤 Uploading thumbnail to Cloudinary...', thumbnailFile.originalname);
      
      const result = await cloudinaryService.uploadImage(
        thumbnailFile.buffer,
        `channels/${channel._id}/videos/thumbnails`
      );
      thumbnailUrl = result.secure_url;
      console.log('✅ Thumbnail uploaded to Cloudinary:', thumbnailUrl);
    }

    if (!videoUrl) {
      console.error('❌ No video file uploaded');
      return sendError(res, 400, 'Video file is required');
    }

    const video = new Video({
      channelId: channel._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      videoUrl: videoUrl,
      thumbnail: thumbnailUrl,
      category: category || 'sports',
      language: language || 'en',
      isPublished: true,
      isChildFriendly: isChildFriendly === 'true' || isChildFriendly === true,
      publishedAt: new Date(),
      likes: 0,
      views: 0,
      comments: 0,
    });

    await video.save();

    console.log('✅ Video uploaded successfully:', video._id);

    return sendResponse(res, 201, true, 'Video uploaded successfully', video);
  } catch (error) {
    console.error('❌ Upload video error:', error);
    return sendError(res, 500, error.message || 'Error uploading video');
  }
};

// ─── UPDATE VIDEO ────────────────────────────────────────────────────────────
exports.updateVideo = async (req, res) => {
  try {
    console.log('📥 Update video request received');
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

    if (video.channelId.ownerId.toString() !== user._id.toString()) {
      return sendError(res, 403, 'Unauthorized to update this video');
    }

    const { title, description, category, language, isPublished, isChildFriendly, keepExistingThumbnail } = req.body;

    if (title) video.title = title.trim();
    if (description) video.description = description.trim();
    if (category) video.category = category;
    if (language) video.language = language;
    if (isPublished !== undefined) video.isPublished = isPublished === 'true';
    if (isChildFriendly !== undefined) video.isChildFriendly = isChildFriendly === 'true';

    if (req.files && req.files.thumbnail && req.files.thumbnail.length > 0) {
      const thumbnailFile = req.files.thumbnail[0];
      console.log('📤 Uploading new thumbnail...');
      
      if (video.thumbnail) {
        try {
          const urlParts = video.thumbnail.split('/');
          const publicIdWithExt = urlParts[urlParts.length - 1];
          const publicId = publicIdWithExt.split('.')[0];
          const folder = urlParts[urlParts.length - 2];
          const fullPublicId = `${folder}/${publicId}`;
          await cloudinaryService.deleteFromCloudinary(fullPublicId);
          console.log('✅ Old thumbnail deleted');
        } catch (deleteError) {
          console.warn('⚠️ Could not delete old thumbnail:', deleteError.message);
        }
      }
      
      const result = await cloudinaryService.uploadImage(
        thumbnailFile.buffer,
        `channels/${video.channelId._id}/videos/thumbnails`
      );
      video.thumbnail = result.secure_url;
      console.log('✅ New thumbnail uploaded:', result.secure_url);
    } else if (keepExistingThumbnail === 'true') {
      console.log('📤 Keeping existing thumbnail');
    }

    video.updatedAt = new Date();
    await video.save();

    return sendResponse(res, 200, true, 'Video updated successfully', video);
  } catch (error) {
    console.error('❌ Update video error:', error);
    return sendError(res, 500, error.message);
  }
};

// ─── DELETE VIDEO ────────────────────────────────────────────────────────────
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

    if (video.channelId.ownerId.toString() !== user._id.toString()) {
      return sendError(res, 403, 'Unauthorized to delete this video');
    }

    if (video.videoUrl) {
      try {
        const urlParts = video.videoUrl.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExt.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const fullPublicId = `${folder}/${publicId}`;
        await cloudinaryService.deleteFromCloudinary(fullPublicId);
        console.log('✅ Video deleted from Cloudinary');
      } catch (deleteError) {
        console.warn('⚠️ Could not delete video from Cloudinary:', deleteError.message);
      }
    }

    if (video.thumbnail) {
      try {
        const urlParts = video.thumbnail.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExt.split('.')[0];
        const folder = urlParts[urlParts.length - 2];
        const fullPublicId = `${folder}/${publicId}`;
        await cloudinaryService.deleteFromCloudinary(fullPublicId);
        console.log('✅ Thumbnail deleted from Cloudinary');
      } catch (deleteError) {
        console.warn('⚠️ Could not delete thumbnail from Cloudinary:', deleteError.message);
      }
    }

    await Like.deleteMany({ videoId: video._id });
    await Comment.deleteMany({ videoId: video._id });

    await video.deleteOne();

    return sendResponse(res, 200, true, 'Video deleted successfully');
  } catch (error) {
    console.error('❌ Delete video error:', error);
    return sendError(res, 500, error.message);
  }
};

// ─── LIKE VIDEO (COMPLETE FIX - Manually handles like/unlike) ──────────────

exports.likeVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const firebaseUid = req.user?.uid;

    console.log('📤 [likeVideo] Request for video:', id);
    console.log('📤 [likeVideo] User:', firebaseUid || 'No user');

    if (!firebaseUid) {
      console.error('❌ [likeVideo] No Firebase UID');
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      console.error('❌ [likeVideo] User not found');
      return sendError(res, 404, 'User not found');
    }

    console.log('👤 [likeVideo] User found:', user._id);

    const video = await Video.findById(id);
    if (!video) {
      console.error('❌ [likeVideo] Video not found');
      return sendError(res, 404, 'Video not found');
    }

    console.log('📹 [likeVideo] Video found:', video._id);
    console.log('📹 [likeVideo] Current video.likes:', video.likes);

    // ─── Check if already liked ─────────────────────────────────────────────
    const existingLike = await Like.findOne({
      userId: user._id,
      videoId: video._id,
    });

    if (existingLike) {
      console.log('ℹ️ [likeVideo] User already liked this video');
      
      // Get actual likes count
      const actualLikesCount = await Like.countDocuments({ videoId: video._id });
      console.log('📊 [likeVideo] Actual likes count from DB:', actualLikesCount);
      
      // Fix inconsistent likes count
      if (video.likes !== actualLikesCount) {
        console.log('🔄 [likeVideo] Fixing inconsistent likes count...');
        video.likes = actualLikesCount;
        await video.save();
        console.log('✅ [likeVideo] Likes count fixed to:', video.likes);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Video already liked',
        data: {
          liked: true,
          likes: video.likes || 0,
        },
      });
    }

    // ─── Create new like ─────────────────────────────────────────────────────
    console.log('📤 [likeVideo] Creating new like...');
    const like = new Like({
      userId: user._id,
      videoId: video._id,
    });
    await like.save();
    console.log('✅ [likeVideo] Like saved:', like._id);

    // ─── Update video likes count ──────────────────────────────────────────
    video.likes = (video.likes || 0) + 1;
    await video.save();
    console.log('✅ [likeVideo] Video likes updated to:', video.likes);

    return res.status(200).json({
      success: true,
      message: 'Video liked successfully',
      data: {
        liked: true,
        likes: video.likes,
      },
    });
  } catch (error) {
    console.error('❌ [likeVideo] Error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      console.log('ℹ️ [likeVideo] Duplicate key error, fetching fresh data...');
      try {
        const freshVideo = await Video.findById(req.params.id);
        const actualCount = await Like.countDocuments({ videoId: req.params.id });
        return res.status(200).json({
          success: true,
          message: 'Video already liked',
          data: {
            liked: true,
            likes: Math.max(actualCount, freshVideo?.likes || 0),
          },
        });
      } catch (freshError) {
        console.error('❌ [likeVideo] Error fetching fresh video:', freshError);
        return sendError(res, 500, 'Failed to process like');
      }
    }
    
    return sendError(res, 500, error.message || 'Failed to like video');
  }
};

// ─── UNLIKE VIDEO ────────────────────────────────────────────────────────────
exports.unlikeVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const firebaseUid = req.user?.uid;

    console.log('📤 [unlikeVideo] Request for video:', id);
    console.log('📤 [unlikeVideo] User:', firebaseUid || 'No user');

    if (!firebaseUid) {
      console.error('❌ [unlikeVideo] No Firebase UID');
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      console.error('❌ [unlikeVideo] User not found');
      return sendError(res, 404, 'User not found');
    }

    console.log('👤 [unlikeVideo] User found:', user._id);

    const video = await Video.findById(id);
    if (!video) {
      console.error('❌ [unlikeVideo] Video not found');
      return sendError(res, 404, 'Video not found');
    }

    console.log('📹 [unlikeVideo] Video found:', video._id);
    console.log('📹 [unlikeVideo] Current video.likes in DB:', video.likes);

    // ─── Check if like exists ──────────────────────────────────────────────
    const like = await Like.findOne({
      userId: user._id,
      videoId: video._id,
    });

    if (!like) {
      console.log('ℹ️ [unlikeVideo] User has not liked this video');
      
      // Get actual likes count
      const actualLikesCount = await Like.countDocuments({ videoId: video._id });
      console.log('📊 [unlikeVideo] Actual likes count from DB:', actualLikesCount);
      
      return res.status(200).json({
        success: true,
        message: 'Video not liked',
        data: {
          liked: false,
          likes: actualLikesCount || 0,
        },
      });
    }

    console.log('📤 [unlikeVideo] Removing like...');
    await like.deleteOne();
    console.log('✅ [unlikeVideo] Like removed');

    // ─── Get actual likes count from database ──────────────────────────────
    const actualLikesCount = await Like.countDocuments({ videoId: video._id });
    console.log('📊 [unlikeVideo] New likes count from DB:', actualLikesCount);
    
    // ─── Update video with correct count ───────────────────────────────────
    video.likes = actualLikesCount;
    await video.save();
    console.log('✅ [unlikeVideo] Video likes updated to:', video.likes);

    return res.status(200).json({
      success: true,
      message: 'Video unliked successfully',
      data: {
        liked: false,
        likes: video.likes,
      },
    });
  } catch (error) {
    console.error('❌ [unlikeVideo] Error:', error);
    return sendError(res, 500, error.message || 'Failed to unlike video');
  }
};

// ─── ADD COMMENT ─────────────────────────────────────────────────────────────
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parentCommentId } = req.body;
    const firebaseUid = req.user?.uid;

    console.log('📤 [addComment] Request for video:', id);

    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    if (!content || !content.trim()) {
      return sendError(res, 400, 'Comment content is required');
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
      content: content.trim(),
      parentCommentId: parentCommentId || null,
    });
    await comment.save();

    video.comments = (video.comments || 0) + 1;
    await video.save();

    await comment.populate('userId', 'name email photoURL');

    return sendResponse(res, 201, true, 'Comment added successfully', comment);
  } catch (error) {
    console.error('❌ [addComment] Error:', error);
    return sendError(res, 500, error.message);
  }
};

// ─── GET COMMENTS ────────────────────────────────────────────────────────────
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await Comment.find({
      videoId: id,
      parentCommentId: null,
    })
      .populate('userId', 'name email photoURL')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Comment.countDocuments({
      videoId: id,
      parentCommentId: null,
    });

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          parentCommentId: comment._id,
        }).populate('userId', 'name email photoURL');
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
    console.error('❌ [getComments] Error:', error);
    return sendError(res, 500, error.message);
  }
};