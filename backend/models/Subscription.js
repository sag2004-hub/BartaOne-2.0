// backend/models/Subscription.js
const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  viewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
  unsubscribedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a viewer can subscribe to a channel only once
SubscriptionSchema.index({ viewerId: 1, channelId: 1 }, { unique: true });

// ─── FIX: Update timestamp on save with proper error handling ────────────
SubscriptionSchema.pre('save', function(next) {
  try {
    this.updatedAt = new Date();
    // Make sure next is a function before calling it
    if (typeof next === 'function') {
      next();
    } else {
      // If next is not a function, we need to handle this differently
      console.warn('⚠️ next is not a function in pre-save middleware');
      // Continue without calling next
      return;
    }
  } catch (error) {
    console.error('❌ Error in pre-save middleware:', error);
    if (typeof next === 'function') {
      next(error);
    }
  }
});

// ─── Alternative: Use async/await style (recommended) ────────────────────
// SubscriptionSchema.pre('save', async function(next) {
//   try {
//     this.updatedAt = new Date();
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// ─── OR: Remove pre-save middleware and use a static method ──────────────
// If the above doesn't work, try removing the pre-save middleware and
// handle the updatedAt in your controller or use this approach:

// SubscriptionSchema.pre('save', function() {
//   this.updatedAt = new Date();
// });

// Method to check if subscription is active
SubscriptionSchema.methods.isActiveSubscription = function() {
  return this.isActive;
};

// Method to activate subscription
SubscriptionSchema.methods.activate = async function() {
  this.isActive = true;
  this.unsubscribedAt = null;
  this.updatedAt = new Date();
  return this.save();
};

// Method to deactivate subscription
SubscriptionSchema.methods.deactivate = async function() {
  this.isActive = false;
  this.unsubscribedAt = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Method to get subscription duration
SubscriptionSchema.methods.getDuration = function() {
  const end = this.unsubscribedAt || new Date();
  const duration = Math.floor((end - this.subscribedAt) / (1000 * 60 * 60 * 24));
  return duration;
};

// ─── STATIC METHODS ──────────────────────────────────────────────────────

// Check if user is subscribed to a channel
SubscriptionSchema.statics.isSubscribed = async function(viewerId, channelId) {
  try {
    const subscription = await this.findOne({
      viewerId,
      channelId,
      isActive: true
    });
    return !!subscription;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};

// Toggle subscription (subscribe/unsubscribe)
SubscriptionSchema.statics.toggleSubscription = async function(viewerId, channelId) {
  try {
    // Check if subscription exists
    let subscription = await this.findOne({
      viewerId,
      channelId
    });

    if (subscription) {
      // If exists, toggle active status
      if (subscription.isActive) {
        subscription.isActive = false;
        subscription.unsubscribedAt = new Date();
        subscription.updatedAt = new Date();
        await subscription.save();
        return { 
          success: true, 
          subscribed: false, 
          action: 'unsubscribed',
          message: 'Unsubscribed successfully'
        };
      } else {
        subscription.isActive = true;
        subscription.unsubscribedAt = null;
        subscription.subscribedAt = new Date(); // Reset subscription date
        subscription.updatedAt = new Date();
        await subscription.save();
        return { 
          success: true, 
          subscribed: true, 
          action: 'subscribed',
          message: 'Subscribed successfully'
        };
      }
    } else {
      // Create new subscription
      subscription = new this({
        viewerId,
        channelId,
        isActive: true,
        subscribedAt: new Date(),
      });
      await subscription.save();
      return { 
        success: true, 
        subscribed: true, 
        action: 'subscribed',
        message: 'Subscribed successfully'
      };
    }
  } catch (error) {
    console.error('Error toggling subscription:', error);
    throw error;
  }
};

// Get all subscriptions for a viewer
SubscriptionSchema.statics.getUserSubscriptions = async function(viewerId) {
  try {
    const subscriptions = await this.find({
      viewerId,
      isActive: true
    }).populate('channelId');
    return subscriptions;
  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    return [];
  }
};

// Get all subscribers for a channel
SubscriptionSchema.statics.getChannelSubscribers = async function(channelId) {
  try {
    const subscriptions = await this.find({
      channelId,
      isActive: true
    }).populate('viewerId', 'name email');
    return subscriptions;
  } catch (error) {
    console.error('Error getting channel subscribers:', error);
    return [];
  }
};

// Get subscription count for a channel
SubscriptionSchema.statics.getSubscriberCount = async function(channelId) {
  try {
    const count = await this.countDocuments({
      channelId,
      isActive: true
    });
    return count;
  } catch (error) {
    console.error('Error getting subscriber count:', error);
    return 0;
  }
};

module.exports = mongoose.model('Subscription', SubscriptionSchema);