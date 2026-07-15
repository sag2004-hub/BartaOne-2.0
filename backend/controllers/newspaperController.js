const Newspaper = require('../models/Newspaper');
const Channel = require('../models/Channel');
const User = require('../models/User');
const { 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  NEWSPAPER_EXPIRY_HOURS, 
  NEWSPAPER_PAGE_LIMIT 
} = require('../utils/constants');

// Get all newspapers with filters
exports.getNewspapers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      channelId, 
      language, 
      region,
      search,
      status = 'active',
      sortBy = 'publishedAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (status === 'active') {
      filter.status = 'active';
      filter.expiresAt = { $gt: new Date() };
    } else if (status === 'all') {
      // Show all newspapers
    } else {
      filter.status = status;
    }

    if (channelId) filter.channelId = channelId;
    if (language) filter.lang = language;
    if (region && region !== 'global') filter.region = region;
    if (search) filter.$text = { $search: search };

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const newspapers = await Newspaper.find(filter)
      .populate('channelId', 'channelName logo description')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Newspaper.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: newspapers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching newspapers:', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR || 'Internal server error',
      error: error.message,
    });
  }
};

// Get active newspapers
exports.getActiveNewspapers = async (req, res) => {
  try {
    const newspapers = await Newspaper.getActive()
      .populate('channelId', 'channelName logo description')
      .sort({ publishedAt: -1 });

    res.status(200).json({
      success: true,
      data: newspapers,
    });
  } catch (error) {
    console.error('Error fetching active newspapers:', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR || 'Internal server error',
    });
  }
};

// Get newspaper by ID
exports.getNewspaperById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 'user' || id === 'channel' || id === 'active' || id === 'stats') {
      return res.status(400).json({
        success: false,
        message: 'Invalid newspaper ID',
      });
    }

    const newspaper = await Newspaper.findById(id)
      .populate('channelId', 'channelName logo description ownerId');

    if (!newspaper) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.NEWSPAPER_NOT_FOUND || 'Newspaper not found',
      });
    }

    if (newspaper.isExpired() && newspaper.status !== 'expired') {
      newspaper.status = 'expired';
      await newspaper.save();
    }

    await newspaper.incrementViews();

    res.status(200).json({
      success: true,
      data: newspaper,
    });
  } catch (error) {
    console.error('Error fetching newspaper:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid newspaper ID format',
      });
    }
    
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR || 'Internal server error',
    });
  }
};

// Create newspaper
exports.createNewspaper = async (req, res) => {
  try {
    const { title, description, pages, language, region, channelId, subtitle, edition, date } = req.body;

    console.log('📰 Creating newspaper...');
    console.log('👤 User UID:', req.user?.uid);
    console.log('📦 Channel ID:', channelId);

    if (!title || !description || !pages || pages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and at least one page are required',
      });
    }

    if (pages.length > (NEWSPAPER_PAGE_LIMIT || 20)) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.NEWSPAPER_PAGE_LIMIT || 'Maximum 20 pages allowed',
      });
    }

    for (let i = 0; i < pages.length; i++) {
      if (!pages[i].content || pages[i].content.trim() === '') {
        return res.status(400).json({
          success: false,
          message: `Page ${i + 1} content cannot be empty`,
        });
      }
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.CHANNEL_NOT_FOUND || 'Channel not found',
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database',
      });
    }

    console.log('👤 User ID from DB:', user._id);
    console.log('🏢 Channel Owner ID:', channel.ownerId);

    if (channel.ownerId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to publish newspaper for this channel',
      });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (NEWSPAPER_EXPIRY_HOURS || 24));

    const newspaper = new Newspaper({
      channelId,
      title,
      subtitle: subtitle || '',
      edition: edition || '',
      date: date || new Date().toISOString().split('T')[0],
      description,
      pages: pages.map((page, index) => ({
        pageNumber: index + 1,
        content: page.content,
        images: page.images || [],
        layout: page.layout || 'full',
      })),
      lang: language || 'en',
      region: region || 'global',
      expiresAt,
      status: 'active',
    });

    await newspaper.save();

    // Send notification - wrapped in try-catch to prevent errors
    try {
      const { sendNotification } = require('../services/notificationService');
      await sendNotification({
        type: 'new_newspaper',
        channelId: channel._id,
        newspaperId: newspaper._id,
        title: `New newspaper published: ${title}`,
        message: `${channel.channelName} has published a new newspaper`,
      });
    } catch (notificationError) {
      console.error('⚠️ Error sending notification (non-critical):', notificationError.message);
    }

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.NEWSPAPER_PUBLISHED || 'Newspaper published successfully',
      data: newspaper,
    });
  } catch (error) {
    console.error('❌ Error creating newspaper:', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR || 'Internal server error',
      error: error.message,
    });
  }
};

// Get user's newspapers
exports.getUserNewspapers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const channels = await Channel.find({ ownerId: user._id });
    const channelIds = channels.map(channel => channel._id);

    if (channelIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0,
        },
      });
    }

    const filter = { channelId: { $in: channelIds } };

    const newspapers = await Newspaper.find(filter)
      .populate('channelId', 'channelName logo')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Newspaper.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: newspapers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching user newspapers:', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR || 'Internal server error',
    });
  }
};

// Update newspaper
exports.updateNewspaper = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, edition, date, description, pages, language, region } = req.body;

    const newspaper = await Newspaper.findById(id);
    if (!newspaper) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.NEWSPAPER_NOT_FOUND || 'Newspaper not found',
      });
    }

    // Verify the requesting user owns this newspaper's channel
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const channel = await Channel.findById(newspaper.channelId);
    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    if (channel.ownerId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this newspaper',
      });
    }

    // Validate pages if provided
    if (pages) {
      if (pages.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Newspaper must have at least one page',
        });
      }
      if (pages.length > (NEWSPAPER_PAGE_LIMIT || 20)) {
        return res.status(400).json({
          success: false,
          message: ERROR_MESSAGES.NEWSPAPER_PAGE_LIMIT || 'Maximum 20 pages allowed',
        });
      }
      for (let i = 0; i < pages.length; i++) {
        if (!pages[i].content || pages[i].content.trim() === '') {
          return res.status(400).json({
            success: false,
            message: `Page ${i + 1} content cannot be empty`,
          });
        }
      }
    }

    // Build update object — only set fields that were sent
    const updateFields = {};
    if (title !== undefined)       updateFields.title       = title;
    if (subtitle !== undefined)    updateFields.subtitle    = subtitle;
    if (edition !== undefined)     updateFields.edition     = edition;
    if (date !== undefined)        updateFields.date        = date;
    if (description !== undefined) updateFields.description = description;
    if (region !== undefined)      updateFields.region      = region;
    // Schema uses 'lang', frontend sends 'language'
    if (language !== undefined)    updateFields.lang        = language;

    if (pages !== undefined) {
      updateFields.pages = pages.map((page, index) => ({
        pageNumber: index + 1,
        content: page.content,
        // Images are base64 strings stored directly in MongoDB — no upload needed.
        // New picks arrive as base64 data URLs; existing ones arrive as the same
        // base64 strings already saved. Both are stored as-is.
        images: page.images || [],
        layout: page.layout || 'full',
      }));
    }

    const updated = await Newspaper.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Newspaper updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('❌ Error updating newspaper:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid newspaper ID format' });
    }
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR || 'Internal server error',
      error: error.message,
    });
  }
};

// Delete newspaper
exports.deleteNewspaper = async (req, res) => {
  try {
    const { id } = req.params;

    const newspaper = await Newspaper.findById(id);
    if (!newspaper) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.NEWSPAPER_NOT_FOUND || 'Newspaper not found',
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const channel = await Channel.findById(newspaper.channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.CHANNEL_NOT_FOUND || 'Channel not found',
      });
    }

    if (channel.ownerId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this newspaper',
      });
    }

    await newspaper.deleteOne();

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.NEWSPAPER_DELETED || 'Newspaper deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting newspaper:', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR || 'Internal server error',
    });
  }
};

// Get newspapers by channel
exports.getNewspapersByChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const filter = {
      channelId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    };

    const newspapers = await Newspaper.find(filter)
      .populate('channelId', 'channelName logo description')
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Newspaper.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: newspapers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching channel newspapers:', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR || 'Internal server error',
    });
  }
};

// Update views
exports.updateViews = async (req, res) => {
  try {
    const { id } = req.params;

    const newspaper = await Newspaper.findById(id);
    if (!newspaper) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.NEWSPAPER_NOT_FOUND || 'Newspaper not found',
      });
    }

    await newspaper.incrementViews();

    res.status(200).json({
      success: true,
      message: 'Views updated successfully',
      views: newspaper.views,
    });
  } catch (error) {
    console.error('Error updating views:', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR || 'Internal server error',
    });
  }
};

// Auto-expire newspapers
exports.autoExpireNewspapers = async (req, res) => {
  try {
    const result = await Newspaper.updateMany(
      {
        status: 'active',
        expiresAt: { $lte: new Date() },
      },
      {
        $set: { status: 'expired' },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Expired newspapers updated',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error auto-expiring newspapers:', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR || 'Internal server error',
    });
  }
};

// ✅ NEW: Get newspaper stats for a channel
// Add this to newspaperController.js

exports.getNewspaperStats = async (req, res) => {
  try {
    const { channelId } = req.params;

    console.log('📊 Fetching newspaper stats for channel:', channelId);

    // Get active newspapers (not expired) - this is the one we care about
    const activeNewspapers = await Newspaper.countDocuments({
      channelId: channelId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    });

    // Also get total for reference
    const totalNewspapers = await Newspaper.countDocuments({ 
      channelId: channelId 
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalNewspapers,
        active: activeNewspapers, // ✅ This will show as "Newspapers" count
      },
    });
  } catch (error) {
    console.error('Error fetching newspaper stats:', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR || 'Internal server error',
    });
  }
};