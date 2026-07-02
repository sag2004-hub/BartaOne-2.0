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

// Update timestamp on save
SubscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if subscription is active
SubscriptionSchema.methods.isActiveSubscription = function() {
  return this.isActive;
};

// Method to activate subscription
SubscriptionSchema.methods.activate = function() {
  this.isActive = true;
  this.unsubscribedAt = null;
  return this.save();
};

// Method to deactivate subscription
SubscriptionSchema.methods.deactivate = function() {
  this.isActive = false;
  this.unsubscribedAt = new Date();
  return this.save();
};

// Method to get subscription duration
SubscriptionSchema.methods.getDuration = function() {
  const end = this.unsubscribedAt || new Date();
  const duration = Math.floor((end - this.subscribedAt) / (1000 * 60 * 60 * 24));
  return duration;
};

module.exports = mongoose.model('Subscription', SubscriptionSchema);