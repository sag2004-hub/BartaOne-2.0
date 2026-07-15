const Newspaper = require('../models/Newspaper');
const Channel = require('../models/Channel');
const cloudinary = require('../config/cloudinary');
const { NEWSPAPER_EXPIRY_HOURS, NEWSPAPER_PAGE_LIMIT } = require('../utils/constants');

class NewspaperService {
  /**
   * Create a new newspaper
   */
  async createNewspaper(data, userId) {
    try {
      const { title, description, pages, language, region, channelId } = data;

      // Validate channel ownership
      const channel = await Channel.findById(channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      if (channel.ownerId.toString() !== userId.toString()) {
        throw new Error('You are not authorized to publish for this channel');
      }

      // Validate pages
      if (!pages || pages.length === 0) {
        throw new Error('At least one page is required');
      }

      if (pages.length > (NEWSPAPER_PAGE_LIMIT || 20)) {
        throw new Error(`Maximum ${NEWSPAPER_PAGE_LIMIT || 20} pages allowed`);
      }

      // Upload images to Cloudinary
      const processedPages = await Promise.all(
        pages.map(async (page, index) => {
          const imageUrls = [];
          
          if (page.images && page.images.length > 0) {
            for (const image of page.images) {
              try {
                const result = await cloudinary.uploader.upload(image, {
                  folder: `newspapers/${channelId}/page-${index + 1}`,
                  resource_type: 'image',
                });
                imageUrls.push({
                  url: result.secure_url,
                  publicId: result.public_id,
                });
              } catch (uploadError) {
                console.error('Error uploading image:', uploadError);
                // Continue with other images
              }
            }
          }

          return {
            pageNumber: index + 1,
            content: page.content,
            images: imageUrls,
            layout: page.layout || 'full',
          };
        })
      );

      // Calculate expiry date (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (NEWSPAPER_EXPIRY_HOURS || 24));

      // Create newspaper
      const newspaper = new Newspaper({
        channelId,
        title,
        description,
        pages: processedPages,
        language: language || 'en',
        region: region || 'global',
        expiresAt,
        status: 'active',
      });

      await newspaper.save();
      return newspaper;
    } catch (error) {
      console.error('Error in createNewspaper service:', error);
      throw error;
    }
  }

  /**
   * Get newspaper by ID
   */
  async getNewspaperById(id) {
    try {
      const newspaper = await Newspaper.findById(id)
        .populate('channelId', 'name logo description ownerId');
      
      if (!newspaper) {
        throw new Error('Newspaper not found');
      }

      // Check if expired
      if (newspaper.isExpired() && newspaper.status !== 'expired') {
        newspaper.status = 'expired';
        await newspaper.save();
      }

      // Increment views
      await newspaper.incrementViews();

      return newspaper;
    } catch (error) {
      console.error('Error in getNewspaperById service:', error);
      throw error;
    }
  }

  /**
   * Get newspapers with filters
   */
  async getNewspapers(filters = {}) {
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
        sortOrder = 'desc',
      } = filters;

      // Build filter
      const filter = {};
      
      if (status === 'active') {
        filter.status = 'active';
        filter.expiresAt = { $gt: new Date() };
      } else if (status !== 'all') {
        filter.status = status;
      }

      if (channelId) {
        filter.channelId = channelId;
      }

      if (language) {
        filter.language = language;
      }

      if (region && region !== 'global') {
        filter.region = region;
      }

      if (search) {
        filter.$text = { $search: search };
      }

      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const newspapers = await Newspaper.find(filter)
        .populate('channelId', 'name logo description')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Newspaper.countDocuments(filter);

      return {
        data: newspapers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error in getNewspapers service:', error);
      throw error;
    }
  }

  /**
   * Get active newspapers (non-expired)
   */
  async getActiveNewspapers() {
    try {
      const newspapers = await Newspaper.getActive()
        .populate('channelId', 'name logo description')
        .sort({ publishedAt: -1 });
      
      return newspapers;
    } catch (error) {
      console.error('Error in getActiveNewspapers service:', error);
      throw error;
    }
  }

  /**
   * Get user's newspapers
   */
  async getUserNewspapers(userId, page = 1, limit = 10) {
    try {
      // Get user's channels
      const channels = await Channel.find({ ownerId: userId });
      const channelIds = channels.map(channel => channel._id);

      if (channelIds.length === 0) {
        return {
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        };
      }

      const filter = {
        channelId: { $in: channelIds },
      };

      const newspapers = await Newspaper.find(filter)
        .populate('channelId', 'name logo')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Newspaper.countDocuments(filter);

      return {
        data: newspapers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error in getUserNewspapers service:', error);
      throw error;
    }
  }

  /**
   * Delete newspaper
   */
  async deleteNewspaper(id, userId) {
    try {
      const newspaper = await Newspaper.findById(id);
      if (!newspaper) {
        throw new Error('Newspaper not found');
      }

      // Check ownership
      const channel = await Channel.findById(newspaper.channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      if (channel.ownerId.toString() !== userId.toString()) {
        throw new Error('You are not authorized to delete this newspaper');
      }

      // Delete images from Cloudinary
      if (newspaper.pages && newspaper.pages.length > 0) {
        for (const page of newspaper.pages) {
          if (page.images && page.images.length > 0) {
            for (const image of page.images) {
              if (image.publicId) {
                try {
                  await cloudinary.uploader.destroy(image.publicId);
                } catch (deleteError) {
                  console.error('Error deleting image from Cloudinary:', deleteError);
                }
              }
            }
          }
        }
      }

      await newspaper.deleteOne();
      return { success: true };
    } catch (error) {
      console.error('Error in deleteNewspaper service:', error);
      throw error;
    }
  }

  /**
   * Auto-expire newspapers
   */
  async autoExpireNewspapers() {
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
      
      return {
        success: true,
        modifiedCount: result.modifiedCount,
      };
    } catch (error) {
      console.error('Error in autoExpireNewspapers service:', error);
      throw error;
    }
  }

  /**
   * Get newspapers by channel
   */
  async getNewspapersByChannel(channelId, page = 1, limit = 10) {
    try {
      const filter = {
        channelId,
        status: 'active',
        expiresAt: { $gt: new Date() },
      };

      const newspapers = await Newspaper.find(filter)
        .populate('channelId', 'name logo description')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Newspaper.countDocuments(filter);

      return {
        data: newspapers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error in getNewspapersByChannel service:', error);
      throw error;
    }
  }

  /**
   * Search newspapers
   */
  async searchNewspapers(query, filters = {}) {
    try {
      const { page = 1, limit = 10, channelId, language, region } = filters;

      const filter = {
        status: 'active',
        expiresAt: { $gt: new Date() },
        $text: { $search: query },
      };

      if (channelId) {
        filter.channelId = channelId;
      }

      if (language) {
        filter.language = language;
      }

      if (region && region !== 'global') {
        filter.region = region;
      }

      const newspapers = await Newspaper.find(filter)
        .populate('channelId', 'name logo description')
        .sort({ score: { $meta: 'textScore' } })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Newspaper.countDocuments(filter);

      return {
        data: newspapers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error in searchNewspapers service:', error);
      throw error;
    }
  }

  /**
   * Get newspaper statistics
   */
  async getNewspaperStats(channelId) {
    try {
      const stats = {
        total: 0,
        active: 0,
        expired: 0,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
      };

      const filter = channelId ? { channelId } : {};

      const newspapers = await Newspaper.find(filter);
      
      stats.total = newspapers.length;
      stats.active = newspapers.filter(n => n.status === 'active' && !n.isExpired()).length;
      stats.expired = newspapers.filter(n => n.status === 'expired' || n.isExpired()).length;
      stats.totalViews = newspapers.reduce((sum, n) => sum + (n.views || 0), 0);
      stats.totalLikes = newspapers.reduce((sum, n) => sum + (n.likes || 0), 0);
      stats.totalShares = newspapers.reduce((sum, n) => sum + (n.shares || 0), 0);

      return stats;
    } catch (error) {
      console.error('Error in getNewspaperStats service:', error);
      throw error;
    }
  }

  /**
   * Update newspaper likes
   */
  async updateLikes(newspaperId, increment = true) {
    try {
      const newspaper = await Newspaper.findById(newspaperId);
      if (!newspaper) {
        throw new Error('Newspaper not found');
      }

      newspaper.likes = increment ? (newspaper.likes || 0) + 1 : Math.max(0, (newspaper.likes || 0) - 1);
      await newspaper.save();

      return { likes: newspaper.likes };
    } catch (error) {
      console.error('Error in updateLikes service:', error);
      throw error;
    }
  }

  /**
   * Update newspaper shares
   */
  async updateShares(newspaperId) {
    try {
      const newspaper = await Newspaper.findById(newspaperId);
      if (!newspaper) {
        throw new Error('Newspaper not found');
      }

      newspaper.shares = (newspaper.shares || 0) + 1;
      await newspaper.save();

      return { shares: newspaper.shares };
    } catch (error) {
      console.error('Error in updateShares service:', error);
      throw error;
    }
  }

  /**
   * Get newspapers by date range
   */
  async getNewspapersByDateRange(startDate, endDate, channelId = null) {
    try {
      const filter = {
        publishedAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };

      if (channelId) {
        filter.channelId = channelId;
      }

      const newspapers = await Newspaper.find(filter)
        .populate('channelId', 'name logo')
        .sort({ publishedAt: -1 });

      return newspapers;
    } catch (error) {
      console.error('Error in getNewspapersByDateRange service:', error);
      throw error;
    }
  }

  /**
   * Get most viewed newspapers
   */
  async getMostViewedNewspapers(limit = 10, channelId = null) {
    try {
      const filter = {
        status: 'active',
        expiresAt: { $gt: new Date() },
      };

      if (channelId) {
        filter.channelId = channelId;
      }

      const newspapers = await Newspaper.find(filter)
        .populate('channelId', 'name logo')
        .sort({ views: -1 })
        .limit(parseInt(limit));

      return newspapers;
    } catch (error) {
      console.error('Error in getMostViewedNewspapers service:', error);
      throw error;
    }
  }

  /**
   * Get newspapers by language
   */
  async getNewspapersByLanguage(language, page = 1, limit = 10) {
    try {
      const filter = {
        language,
        status: 'active',
        expiresAt: { $gt: new Date() },
      };

      const newspapers = await Newspaper.find(filter)
        .populate('channelId', 'name logo description')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Newspaper.countDocuments(filter);

      return {
        data: newspapers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error in getNewspapersByLanguage service:', error);
      throw error;
    }
  }
}

module.exports = new NewspaperService();