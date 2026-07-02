const admin = require('../config/firebaseAdmin');
const { sendError } = require('../utils/response');

/**
 * Middleware to verify Firebase ID token
 * Extracts token from Authorization header, verifies it, and attaches user info to req
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 401, 'No token provided. Please authenticate.');
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return sendError(res, 401, 'No token provided. Please authenticate.');
    }

    // Verify the token with Firebase Admin
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Attach user info to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email?.split('@')[0],
        emailVerified: decodedToken.email_verified || false,
        picture: decodedToken.picture || null,
        ...decodedToken,
      };

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      
      if (error.code === 'auth/id-token-expired') {
        return sendError(res, 401, 'Token expired. Please refresh your session.');
      }
      
      if (error.code === 'auth/id-token-revoked') {
        return sendError(res, 401, 'Token revoked. Please login again.');
      }
      
      return sendError(res, 401, 'Invalid token. Please authenticate again.');
    }
  } catch (error) {
    console.error('Firebase auth middleware error:', error);
    return sendError(res, 500, 'Authentication error');
  }
};

/**
 * Optional middleware - Verifies token if present, but doesn't require it
 */
const optionalFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      
      if (token) {
        try {
          const decodedToken = await admin.auth().verifyIdToken(token);
          req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || decodedToken.email?.split('@')[0],
            emailVerified: decodedToken.email_verified || false,
            picture: decodedToken.picture || null,
            ...decodedToken,
          };
        } catch (error) {
          // Token is invalid, but we don't block the request
          console.warn('Optional token verification failed:', error.message);
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional Firebase auth middleware error:', error);
    next();
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Authentication required');
      }

      // Get user from database to check role
      const User = require('../models/User');
      const user = await User.findOne({ firebaseUid: req.user.uid });
      
      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      if (!roles.includes(user.role)) {
        return sendError(res, 403, 'Insufficient permissions');
      }

      // Attach user document to request
      req.userDoc = user;
      next();
    } catch (error) {
      console.error('Role verification error:', error);
      return sendError(res, 500, 'Role verification failed');
    }
  };
};

/**
 * Middleware to check if user owns a channel
 */
const requireChannelOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required');
    }

    const User = require('../models/User');
    const Channel = require('../models/Channel');
    
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Check if user has a channel
    const channel = await Channel.findOne({ ownerId: user._id });
    if (!channel) {
      return sendError(res, 404, 'No channel found for this user');
    }

    req.userDoc = user;
    req.channel = channel;
    next();
  } catch (error) {
    console.error('Channel owner verification error:', error);
    return sendError(res, 500, 'Channel verification failed');
  }
};

module.exports = {
  verifyFirebaseToken,
  optionalFirebaseToken,
  requireRole,
  requireChannelOwner,
};