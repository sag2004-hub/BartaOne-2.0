const Channel = require('../models/Channel');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { sendResponse, sendError } = require('../utils/response');
const { uploadToCloudinary } = require('../services/cloudinaryService');

// Get all channels with location filtering
exports.getAllChannels = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, state, city, search } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (state) query['location.state'] = { $regex: state, $options: 'i' };
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (search) {
      query.$or = [
        { channelName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } },
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
    console.log('📥 Create channel request received');
    console.log('📥 Request body:', req.body);
    console.log('📥 Request files:', req.files ? Object.keys(req.files) : 'none');
    
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
      return sendError(res, 400, 'You already have a channel. Only one channel per owner is allowed.');
    }

    // Extract location from req.body
    let location = {};
    
    if (req.body.location) {
      try {
        if (typeof req.body.location === 'string') {
          location = JSON.parse(req.body.location);
        } else {
          location = req.body.location;
        }
        console.log('📍 Location extracted:', location);
      } catch (e) {
        console.warn('⚠️ Could not parse location field:', e.message);
        location = {};
      }
    }
    
    // Also check for individual location fields (fallback)
    if (!location.state && req.body.state) location.state = req.body.state;
    if (!location.district && req.body.district) location.district = req.body.district;
    if (!location.city && req.body.city) location.city = req.body.city;
    if (!location.area && req.body.area) location.area = req.body.area;

    console.log('📍 Final location:', location);

    const {
      channelName,
      description,
      language,
      category,
    } = req.body;

    // Validate required fields
    if (!channelName || !channelName.trim()) {
      return sendError(res, 400, 'Channel name is required');
    }
    if (!description || !description.trim()) {
      return sendError(res, 400, 'Description is required');
    }

    // Check if channel name already exists
    const channelExists = await Channel.findOne({ channelName: channelName.trim() });
    if (channelExists) {
      return sendError(res, 400, 'Channel name already exists');
    }

    // Upload logo if provided (for FormData uploads)
    let logoUrl = null;
    if (req.files && req.files.logo) {
      try {
        const result = await uploadToCloudinary(req.files.logo[0].buffer, 'channels/logos');
        logoUrl = result.secure_url;
        console.log('✅ Logo uploaded:', logoUrl);
      } catch (uploadErr) {
        console.error('⚠️ Logo upload failed:', uploadErr.message);
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

    // Create channel
    const channelData = {
      ownerId: user._id,
      channelName: channelName.trim(),
      description: description.trim(),
      language: language || 'en',
      category: category || 'news',
      location: {
        state: location.state || '',
        district: location.district || '',
        city: location.city || '',
        area: location.area || '',
      },
      isActive: true,
      isVerified: false,
      followers: 0,
    };

    // Add logo if uploaded
    if (logoUrl) channelData.logo = logoUrl;
    if (bannerUrl) channelData.banner = bannerUrl;

    const channel = new Channel(channelData);
    await channel.save();

    // Update user role to owner
    user.role = 'owner';
    await user.save();

    console.log('✅ Channel created successfully:', channel._id);

    return sendResponse(res, 201, true, 'Channel created successfully', channel);
  } catch (error) {
    console.error('❌ Create channel error:', error);
    return sendError(res, 500, error.message || 'Error creating channel');
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
    if (channelName) channel.channelName = channelName.trim();
    if (description) channel.description = description.trim();
    if (language) channel.language = language;
    if (location) {
      if (typeof location === 'string') {
        try {
          const parsedLocation = JSON.parse(location);
          channel.location = parsedLocation;
        } catch (e) {
          channel.location = location;
        }
      } else {
        channel.location = location;
      }
    }
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

    const existingSubscription = await Subscription.findOne({
      viewerId: user._id,
      channelId: channel._id,
    });

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return sendError(res, 400, 'Already subscribed');
      }
      existingSubscription.isActive = true;
      await existingSubscription.save();
    } else {
      const subscription = new Subscription({
        viewerId: user._id,
        channelId: channel._id,
      });
      await subscription.save();
    }

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

// ✅ FIXED: Get channel stats (removed Live reference)
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

    const Article = require('../models/Article');
    const articleCount = await Article.countDocuments({ channelId: channel._id });

    const Video = require('../models/Video');
    const videoCount = await Video.countDocuments({ channelId: channel._id });

    // ✅ REMOVED: Live model reference
    // const Live = require('../models/Live');
    // const liveCount = await Live.countDocuments({ channelId: channel._id });

    return sendResponse(res, 200, true, 'Channel stats fetched successfully', {
      followers: subscriptionCount,
      articles: articleCount,
      videos: videoCount,
      // live: liveCount, // ❌ REMOVED
    });
  } catch (error) {
    console.error('Get channel stats error:', error);
    return sendError(res, 500, error.message);
  }
};