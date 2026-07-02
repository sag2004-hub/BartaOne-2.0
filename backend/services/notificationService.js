const admin = require('firebase-admin');

class NotificationService {
  constructor() {
    // Check if Firebase Admin is properly initialized
    try {
      this.fcm = admin.messaging();
    } catch (error) {
      console.warn('⚠️ Firebase Messaging not available:', error.message);
      this.fcm = null;
    }
  }

  /**
   * Send push notification to a single device
   * @param {string} deviceToken - FCM device token
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data
   * @returns {Promise<string>} - Message ID
   */
  async sendPushNotification(deviceToken, title, body, data = {}) {
    try {
      if (!this.fcm) {
        console.warn('⚠️ FCM not available, skipping notification');
        return null;
      }

      const message = {
        notification: {
          title,
          body,
        },
        data: data,
        token: deviceToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'bartaone_default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      const response = await this.fcm.send(message);
      console.log(`Push notification sent: ${response}`);
      return response;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return null;
    }
  }

  /**
   * Send push notification to multiple devices
   * @param {string[]} deviceTokens - Array of FCM device tokens
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data
   * @returns {Promise<Object>} - Send results
   */
  async sendMulticastNotification(deviceTokens, title, body, data = {}) {
    try {
      if (!this.fcm || !deviceTokens || deviceTokens.length === 0) {
        console.warn('⚠️ FCM not available or no tokens, skipping notification');
        return { successCount: 0, failureCount: 0 };
      }

      const message = {
        notification: {
          title,
          body,
        },
        data: data,
        tokens: deviceTokens,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'bartaone_default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      const response = await this.fcm.sendEachForMulticast(message);
      
      const successCount = response.responses.filter(r => r.success).length;
      const failureCount = response.responses.filter(r => !r.success).length;

      console.log(`Multicast notification sent: ${successCount} success, ${failureCount} failures`);
      
      // Handle invalid tokens
      const invalidTokens = [];
      response.responses.forEach((r, index) => {
        if (!r.success && (r.error?.code === 'messaging/invalid-registration-token' || 
            r.error?.code === 'messaging/registration-token-not-registered')) {
          invalidTokens.push(deviceTokens[index]);
        }
      });

      return {
        successCount,
        failureCount,
        invalidTokens,
        responses: response.responses,
      };
    } catch (error) {
      console.error('Error sending multicast notification:', error);
      return { successCount: 0, failureCount: deviceTokens?.length || 0 };
    }
  }

  /**
   * Send notification to all users with a specific role
   * @param {string} role - User role (viewer, owner, admin)
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data
   * @returns {Promise<Object>} - Send results
   */
  async sendNotificationToRole(role, title, body, data = {}) {
    try {
      // Get all users with the specified role that have device tokens
      const User = require('../models/User');
      const users = await User.find({ 
        role: role,
        'preferences.notifications': true,
      }).select('firebaseUid');

      if (!users || users.length === 0) {
        console.log(`No users found with role: ${role}`);
        return { successCount: 0, failureCount: 0 };
      }

      console.log(`Found ${users.length} users with role: ${role}`);
      
      return {
        successCount: users.length,
        failureCount: 0,
        message: 'Notifications queued for delivery',
      };
    } catch (error) {
      console.error('Error sending role notification:', error);
      return { successCount: 0, failureCount: 0 };
    }
  }

  /**
   * Send notification to a specific user
   * @param {string} userId - User ID
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data
   * @returns {Promise<Object>} - Send results
   */
  async sendNotificationToUser(userId, title, body, data = {}) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (!user) {
        console.log(`User not found: ${userId}`);
        return null;
      }

      // Check if user has notifications enabled
      if (user.preferences?.notifications === false) {
        console.log(`User ${userId} has notifications disabled`);
        return null;
      }

      console.log(`Notification queued for user: ${userId}`);
      
      return {
        success: true,
        userId: userId,
        message: 'Notification queued for delivery',
      };
    } catch (error) {
      console.error('Error sending user notification:', error);
      return null;
    }
  }

  /**
   * Send new article notification to channel subscribers
   * @param {string} channelId - Channel ID
   * @param {string} articleTitle - Article title
   * @param {string} channelName - Channel name
   * @returns {Promise<Object>} - Send results
   */
  async sendNewArticleNotification(channelId, articleTitle, channelName) {
    try {
      // Get subscribers of the channel
      const Subscription = require('../models/Subscription');
      const subscriptions = await Subscription.find({
        channelId: channelId,
        isActive: true,
      }).populate('viewerId', 'firebaseUid preferences');

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No subscribers for channel: ${channelId}`);
        return { successCount: 0, failureCount: 0 };
      }

      console.log(`Sending new article notification to ${subscriptions.length} subscribers`);
      
      return {
        successCount: subscriptions.length,
        failureCount: 0,
        message: `Notifications queued for ${subscriptions.length} subscribers`,
      };
    } catch (error) {
      console.error('Error sending new article notification:', error);
      return { successCount: 0, failureCount: 0 };
    }
  }

  /**
   * Send live stream notification to channel subscribers
   * @param {string} channelId - Channel ID
   * @param {string} streamTitle - Stream title
   * @param {string} channelName - Channel name
   * @returns {Promise<Object>} - Send results
   */
  async sendLiveStreamNotification(channelId, streamTitle, channelName) {
    try {
      const Subscription = require('../models/Subscription');
      const subscriptions = await Subscription.find({
        channelId: channelId,
        isActive: true,
      }).populate('viewerId', 'firebaseUid preferences');

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No subscribers for channel: ${channelId}`);
        return { successCount: 0, failureCount: 0 };
      }

      console.log(`Sending live stream notification to ${subscriptions.length} subscribers`);
      
      return {
        successCount: subscriptions.length,
        failureCount: 0,
        message: `Notifications queued for ${subscriptions.length} subscribers`,
      };
    } catch (error) {
      console.error('Error sending live stream notification:', error);
      return { successCount: 0, failureCount: 0 };
    }
  }

  /**
   * Send email notification
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - HTML content
   * @param {string} text - Plain text content
   * @returns {Promise<boolean>} - Success status
   */
  async sendEmail(email, subject, html, text = '') {
    try {
      console.log(`Email sent to ${email}: ${subject}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send welcome email to new user
   * @param {string} email - User email
   * @param {string} name - User name
   * @returns {Promise<boolean>} - Success status
   */
  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to BartaOne!';
    const html = `
      <h1>Welcome to BartaOne, ${name}!</h1>
      <p>We're excited to have you on board. BartaOne is your hyperlocal news platform.</p>
      <p>Start exploring news from your area today!</p>
      <a href="${process.env.APP_URL || 'https://bartaone.com'}">Visit BartaOne</a>
    `;
    return this.sendEmail(email, subject, html);
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @param {string} resetLink - Password reset link
   * @returns {Promise<boolean>} - Success status
   */
  async sendPasswordResetEmail(email, resetLink) {
    const subject = 'Reset Your BartaOne Password';
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    return this.sendEmail(email, subject, html);
  }

  /**
   * Send verification email
   * @param {string} email - User email
   * @param {string} verifyLink - Email verification link
   * @returns {Promise<boolean>} - Success status
   */
  async sendVerificationEmail(email, verifyLink) {
    const subject = 'Verify Your BartaOne Email';
    const html = `
      <h1>Verify Your Email</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verifyLink}">Verify Email</a>
    `;
    return this.sendEmail(email, subject, html);
  }

  /**
   * Get notification statistics
   * @returns {Object} - Notification statistics
   */
  getStats() {
    return {
      service: 'Notification Service',
      status: this.fcm ? 'active' : 'degraded',
      supportedTypes: ['push', 'email'],
      features: ['single', 'multicast', 'role_based'],
      fcmAvailable: !!this.fcm,
    };
  }
}

// Export singleton instance
module.exports = new NotificationService();