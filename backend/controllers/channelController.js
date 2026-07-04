const Channel = require('../models/Channel');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { sendResponse, sendError } = require('../utils/response');
const { uploadToCloudinary } = require('../services/cloudinaryService');

// Get all channels
exports.getAllChannels = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, state, city, search } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (state) query['location.state'] = state;
    if (city) query['location.city'] = city;
    if (search) {
      query.$or = [
        { channelName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const channels = await Channel.find(query)
      .populate('ownerId', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Channel.countDocuments(query);

    return sendResponse(res, 200, true, 'Channels fetched successfully', {
      channels,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get all channels error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get channel by ID
exports.getChannelById = async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await Channel.findById(id)
      .populate('ownerId', 'name email phone');

    if (!channel) {
      return sendError(res, 404, 'Channel not found');
    }

    // Check if current user is subscribed
    let isSubscribed = false;
    if (req.user?.uid) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (user) {
        const subscription = await Subscription.findOne({
          viewerId: user._id,
          channelId: channel._id,
          isActive: true,
        });
        isSubscribed = !!subscription;
      }
    }

    const channelData = channel.toObject();
    channelData.isSubscribed = isSubscribed;

    return sendResponse(res, 200, true, 'Channel fetched successfully', channelData);
  } catch (error) {
    console.error('Get channel by ID error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get channel by owner
exports.getChannelByOwner = async (req, res) => {
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

    return sendResponse(res, 200, true, 'Channel fetched successfully', channel);
  } catch (error) {
    console.error('Get channel by owner error:', error);
    return sendError(res, 500, error.message);
  }
};

// Create channel
exports.createChannel = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Check if user already has a channel
    const existingChannel = await Channel.findOne({ ownerId: user._id });
    if (existingChannel) {
      return sendError(res, 400, 'User already has a channel');
    }

    const {
      channelName,
      description,
      language,
      category,
    } = req.body;

    // location may arrive as a JSON string (from React Native FormData)
    let location = {};
    if (req.body.location) {
      try {
        location = typeof req.body.location === 'string'
          ? JSON.parse(req.body.location)
          : req.body.location;
      } catch (e) {
        console.warn('Could not parse location field:', e.message);
      }
    }

    console.log('📍 Location parsed:', location);
    console.log('📁 Files received:', req.files ? Object.keys(req.files) : 'none');

    // Upload logo if provided
    let logoUrl = 'https://via.placeholder.com/100';
    if (req.files && req.files.logo) {
      try {
        const result = await uploadToCloudinary(req.files.logo[0].buffer, 'channels/logos');
        logoUrl = result.secure_url;
        console.log('✅ Logo uploaded:', logoUrl);
      } catch (uploadErr) {
        console.error('⚠️ Logo upload failed, using placeholder:', uploadErr.message);
      }
    }

    // Upload banner if provided
    let bannerUrl = null;
    if (req.files && req.files.banner) {
      try {
        const result = await uploadToCloudinary(req.files.banner[0].buffer, 'channels/banners');
        bannerUrl = result.secure_url;
        console.log('✅ Banner uploaded:', bannerUrl);
      } catch (uploadErr) {
        console.error('⚠️ Banner upload failed:', uploadErr.message);
      }
    }

    const channel = new Channel({
      ownerId: user._id,
      channelName,
      description,
      logo:     logoUrl,
      banner:   bannerUrl,
      language: language || 'en',
      location,
      category: category || 'news',
    });

    await channel.save();

    // Update user role to owner
    user.role = 'owner';
    await user.save();

    return sendResponse(res, 201, true, 'Channel created successfully', channel);
  } catch (error) {
    console.error('Create channel error:', error);
    return sendError(res, 500, error.message);
  }
};

// Update channel
exports.updateChannel = async (req, res) => {
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

    const channel = await Channel.findOne({ _id: id, ownerId: user._id });
    if (!channel) {
      return sendError(res, 404, 'Channel not found or unauthorized');
    }

    const {
      channelName,
      description,
      language,
      location,
      category,
      isActive,
    } = req.body;

    // Update fields
    if (channelName) channel.channelName = channelName;
    if (description) channel.description = description;
    if (language) channel.language = language;
    if (location) channel.location = location;
    if (category) channel.category = category;
    if (isActive !== undefined) channel.isActive = isActive;

    // Upload logo if provided
    if (req.files && req.files.logo) {
      const result = await uploadToCloudinary(req.files.logo[0].buffer, 'channels/logos');
      channel.logo = result.secure_url;
    }

    // Upload banner if provided
    if (req.files && req.files.banner) {
      const result = await uploadToCloudinary(req.files.banner[0].buffer, 'channels/banners');
      channel.banner = result.secure_url;
    }

    channel.updatedAt = new Date();
    await channel.save();

    return sendResponse(res, 200, true, 'Channel updated successfully', channel);
  } catch (error) {
    console.error('Update channel error:', error);
    return sendError(res, 500, error.message);
  }
};

// Delete channel
exports.deleteChannel = async (req, res) => {
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

    const channel = await Channel.findOne({ _id: id, ownerId: user._id });
    if (!channel) {
      return sendError(res, 404, 'Channel not found or unauthorized');
    }

    await channel.deleteOne();

    // Update user role back to viewer
    user.role = 'viewer';
    await user.save();

    return sendResponse(res, 200, true, 'Channel deleted successfully');
  } catch (error) {
    console.error('Delete channel error:', error);
    return sendError(res, 500, error.message);
  }
};

// Subscribe to channel
exports.subscribeChannel = async (req, res) => {
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

    const channel = await Channel.findById(id);
    if (!channel) {
      return sendError(res, 404, 'Channel not found');
    }

    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
      viewerId: user._id,
      channelId: channel._id,
    });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return sendError(res, 400, 'Already subscribed');
      }
      // Reactivate subscription
      existingSubscription.isActive = true;
      await existingSubscription.save();
    } else {
      // Create new subscription
      const subscription = new Subscription({
        viewerId: user._id,
        channelId: channel._id,
      });
      await subscription.save();
    }

    // Increment followers count
    channel.followers += 1;
    await channel.save();

    return sendResponse(res, 200, true, 'Subscribed successfully');
  } catch (error) {
    console.error('Subscribe channel error:', error);
    return sendError(res, 500, error.message);
  }
};

// Unsubscribe from channel
exports.unsubscribeChannel = async (req, res) => {
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

    const channel = await Channel.findById(id);
    if (!channel) {
      return sendError(res, 404, 'Channel not found');
    }

    const subscription = await Subscription.findOne({
      viewerId: user._id,
      channelId: channel._id,
    });

    if (!subscription || !subscription.isActive) {
      return sendError(res, 400, 'Not subscribed');
    }

    subscription.isActive = false;
    await subscription.save();

    // Decrement followers count
    channel.followers = Math.max(channel.followers - 1, 0);
    await channel.save();

    return sendResponse(res, 200, true, 'Unsubscribed successfully');
  } catch (error) {
    console.error('Unsubscribe channel error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get subscribers
exports.getSubscribers = async (req, res) => {
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

    const subscriptions = await Subscription.find({
      channelId: channel._id,
      isActive: true,
    }).populate('viewerId', 'name email profilePicture');

    return sendResponse(res, 200, true, 'Subscribers fetched successfully', subscriptions);
  } catch (error) {
    console.error('Get subscribers error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get channel stats
exports.getChannelStats = async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await Channel.findById(id);
    if (!channel) {
      return sendError(res, 404, 'Channel not found');
    }

    const subscriptionCount = await Subscription.countDocuments({
      channelId: channel._id,
      isActive: true,
    });

    // Get article count
    const Article = require('../models/Article');
    const articleCount = await Article.countDocuments({ channelId: channel._id });

    // Get video count
    const Video = require('../models/Video');
    const videoCount = await Video.countDocuments({ channelId: channel._id });

    // Get live count
    const Live = require('../models/Live');
    const liveCount = await Live.countDocuments({ channelId: channel._id });

    return sendResponse(res, 200, true, 'Channel stats fetched successfully', {
      followers: subscriptionCount,
      articles: articleCount,
      videos: videoCount,
      live: liveCount,
    });
  } catch (error) {
    console.error('Get channel stats error:', error);
    return sendError(res, 500, error.message);
  }
};