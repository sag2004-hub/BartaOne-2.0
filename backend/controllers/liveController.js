// backend/controllers/liveController.js
const Live = require('../models/Live');
const Channel = require('../models/Channel');
const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/response');

// Get all live streams
exports.getAllLiveStreams = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) query.status = status;
    else query.status = { $in: ['live', 'scheduled'] };

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

    // Find user by firebaseUid
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Find channel by ownerId (which is the user's _id)
    const channel = await Channel.findOne({ ownerId: user._id });
    if (!channel) {
      return sendError(res, 404, 'Channel not found. Please create a channel first.');
    }

    const { title, description, language, thumbnail } = req.body;

    // Check if already live
    const existingLive = await Live.findOne({
      channelId: channel._id,
      status: 'live',
    });

    if (existingLive) {
      return sendError(res, 400, 'Channel is already live');
    }

    // Generate stream key
    const streamKey = require('crypto').randomBytes(16).toString('hex');

    const live = new Live({
      channelId: channel._id,
      title,
      description,
      thumbnail: thumbnail || null,
      language: language || 'en',
      status: 'live',
      startedAt: new Date(),
      streamKey,
    });

    await live.save();

    return sendResponse(res, 201, true, 'Live stream started successfully', {
      ...live.toJSON(),
      rtmpUrl: 'rtmp://your-streaming-server/live',
    });
  } catch (error) {
    console.error('Start live stream error:', error);
    return sendError(res, 500, error.message);
  }
};

// Schedule live stream
exports.scheduleLiveStream = async (req, res) => {
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
      return sendError(res, 404, 'Channel not found. Please create a channel first.');
    }

    const { title, description, language, thumbnail, scheduledFor } = req.body;

    if (!scheduledFor) {
      return sendError(res, 400, 'Scheduled date and time is required');
    }

    const live = new Live({
      channelId: channel._id,
      title,
      description,
      thumbnail: thumbnail || null,
      language: language || 'en',
      status: 'scheduled',
      scheduledFor: new Date(scheduledFor),
    });

    await live.save();

    return sendResponse(res, 201, true, 'Live stream scheduled successfully', live);
  } catch (error) {
    console.error('Schedule live stream error:', error);
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

    const channel = await Channel.findOne({ ownerId: user._id });
    if (!channel) {
      return sendError(res, 404, 'Channel not found');
    }

    const live = await Live.findOne({ _id: id, channelId: channel._id });
    if (!live) {
      return sendError(res, 404, 'Live stream not found');
    }

    live.status = 'ended';
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

    const channel = await Channel.findOne({ ownerId: user._id });
    if (!channel) {
      return sendError(res, 404, 'Channel not found');
    }

    const live = await Live.findOne({ _id: id, channelId: channel._id });
    if (!live) {
      return sendError(res, 404, 'Live stream not found');
    }

    const { title, description, language, thumbnail } = req.body;

    if (title) live.title = title;
    if (description) live.description = description;
    if (language) live.language = language;
    if (thumbnail) live.thumbnail = thumbnail;

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

    return sendResponse(res, 200, true, 'Viewer count fetched successfully', {
      viewers: live.viewers || 0,
      maxViewers: live.maxViewers || 0,
    });
  } catch (error) {
    console.error('Get viewers error:', error);
    return sendError(res, 500, error.message);
  }
};