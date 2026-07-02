const Live = require('../models/Live');
const Channel = require('../models/Channel');
const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/response');
const { uploadToCloudinary } = require('../services/cloudinaryService');

// Get all live streams
exports.getAllLiveStreams = async (req, res) => {
  try {
    const { page = 1, limit = 10, isLive = true } = req.query;

    const query = { isLive: isLive === 'true' };
    
    const streams = await Live.find(query)
      .populate('channelId', 'channelName logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ startedAt: -1 });

    const total = await Live.countDocuments(query);

    return sendResponse(res, 200, true, 'Live streams fetched successfully', {
      streams,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get all live streams error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get live stream by ID
exports.getLiveStreamById = async (req, res) => {
  try {
    const { id } = req.params;

    const stream = await Live.findById(id)
      .populate('channelId', 'channelName logo description location');

    if (!stream) {
      return sendError(res, 404, 'Live stream not found');
    }

    return sendResponse(res, 200, true, 'Live stream fetched successfully', stream);
  } catch (error) {
    console.error('Get live stream by ID error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get live streams by channel
exports.getLiveStreamsByChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const streams = await Live.find({ channelId })
      .populate('channelId', 'channelName logo')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ startedAt: -1 });

    const total = await Live.countDocuments({ channelId });

    return sendResponse(res, 200, true, 'Channel live streams fetched successfully', {
      streams,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get live streams by channel error:', error);
    return sendError(res, 500, error.message);
  }
};

// Start live stream
exports.startLiveStream = async (req, res) => {
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

    const { title, description, language } = req.body;

    // Check if already live
    const existingLive = await Live.findOne({
      channelId: channel._id,
      isLive: true,
    });

    if (existingLive) {
      return sendError(res, 400, 'Channel is already live');
    }

    // Upload thumbnail if provided
    let thumbnailUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'live/thumbnails');
      thumbnailUrl = result.secure_url;
    }

    // Generate stream URL (in production, use actual streaming service)
    const streamUrl = `rtmp://stream.bartaone.com/live/${channel._id}`;

    const live = new Live({
      channelId: channel._id,
      title,
      description,
      streamUrl,
      thumbnail: thumbnailUrl,
      language: language || 'en',
      isLive: true,
    });

    await live.save();

    return sendResponse(res, 201, true, 'Live stream started successfully', live);
  } catch (error) {
    console.error('Start live stream error:', error);
    return sendError(res, 500, error.message);
  }
};

// End live stream
exports.endLiveStream = async (req, res) => {
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

    const live = await Live.findById(id).populate('channelId');
    if (!live) {
      return sendError(res, 404, 'Live stream not found');
    }

    // Check if user owns the channel
    if (live.channelId.ownerId.toString() !== user._id.toString()) {
      return sendError(res, 403, 'Unauthorized to end this stream');
    }

    live.isLive = false;
    live.endedAt = new Date();
    await live.save();

    return sendResponse(res, 200, true, 'Live stream ended successfully', live);
  } catch (error) {
    console.error('End live stream error:', error);
    return sendError(res, 500, error.message);
  }
};

// Update live stream
exports.updateLiveStream = async (req, res) => {
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

    const live = await Live.findById(id).populate('channelId');
    if (!live) {
      return sendError(res, 404, 'Live stream not found');
    }

    // Check if user owns the channel
    if (live.channelId.ownerId.toString() !== user._id.toString()) {
      return sendError(res, 403, 'Unauthorized to update this stream');
    }

    const { title, description, language } = req.body;

    if (title) live.title = title;
    if (description) live.description = description;
    if (language) live.language = language;

    // Upload thumbnail if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'live/thumbnails');
      live.thumbnail = result.secure_url;
    }

    live.updatedAt = new Date();
    await live.save();

    return sendResponse(res, 200, true, 'Live stream updated successfully', live);
  } catch (error) {
    console.error('Update live stream error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get viewer count
exports.getViewers = async (req, res) => {
  try {
    const { id } = req.params;

    const live = await Live.findById(id);
    if (!live) {
      return sendError(res, 404, 'Live stream not found');
    }

    // In production, this would be from a real-time service
    // For now, we'll return the stored viewer count
    return sendResponse(res, 200, true, 'Viewer count fetched successfully', {
      viewers: live.viewers || 0,
    });
  } catch (error) {
    console.error('Get viewers error:', error);
    return sendError(res, 500, error.message);
  }
};