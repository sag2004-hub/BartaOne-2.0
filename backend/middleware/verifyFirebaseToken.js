// backend/middleware/verifyFirebaseToken.js
const { getAuth } = require('../config/firebaseAdmin');
const { sendError } = require('../utils/response');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log('🔑 [verifyFirebaseToken] Auth header:', authHeader ? 'Present ✅' : 'Missing ❌');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [verifyFirebaseToken] No token provided');
      return sendError(res, 401, 'No token provided. Please authenticate.');
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      console.log('❌ [verifyFirebaseToken] Empty token');
      return sendError(res, 401, 'No token provided. Please authenticate.');
    }

    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      console.log('✅ [verifyFirebaseToken] verified uid:', decodedToken.uid);

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
      console.error('❌ [verifyFirebaseToken] Token verification failed:', error.code, error.message);

      if (error.code === 'auth/id-token-expired') {
        return sendError(res, 401, 'Token expired. Please refresh your session.');
      }
      if (error.code === 'auth/id-token-revoked') {
        return sendError(res, 401, 'Token revoked. Please login again.');
      }
      if (error.code === 'auth/argument-error') {
        return sendError(res, 401, 'Malformed token. Please login again.');
      }

      return sendError(res, 401, 'Invalid token. Please authenticate again.');
    }
  } catch (error) {
    console.error('❌ [verifyFirebaseToken] Middleware error:', error);
    return sendError(res, 500, 'Authentication error');
  }
};

const optionalFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔑 [optionalFirebaseToken] Auth header:', authHeader ? 'Present ✅' : 'Missing ❌');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      if (token) {
        try {
          const decodedToken = await getAuth().verifyIdToken(token);
          console.log('✅ [optionalFirebaseToken] verified uid:', decodedToken.uid);
          req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || decodedToken.email?.split('@')[0],
            emailVerified: decodedToken.email_verified || false,
            picture: decodedToken.picture || null,
            ...decodedToken,
          };
        } catch (error) {
          console.warn('⚠️ [optionalFirebaseToken] Token verification failed:', error.code, error.message);
        }
      }
    } else {
      console.log('ℹ️ [optionalFirebaseToken] No token provided, continuing as anonymous');
    }

    next();
  } catch (error) {
    console.error('❌ [optionalFirebaseToken] Middleware error:', error);
    next();
  }
};

const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return sendError(res, 401, 'Authentication required');
      }

      const User = require('../models/User');
      const user = await User.findOne({ firebaseUid: req.user.uid });

      if (!user) {
        return sendError(res, 404, 'User not found');
      }

      if (!roles.includes(user.role)) {
        return sendError(res, 403, 'Insufficient permissions');
      }

      req.userDoc = user;
      next();
    } catch (error) {
      console.error('❌ [requireRole] error:', error);
      return sendError(res, 500, 'Role verification failed');
    }
  };
};

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

    const channel = await Channel.findOne({ ownerId: user._id });
    if (!channel) {
      return sendError(res, 404, 'No channel found for this user');
    }

    req.userDoc = user;
    req.channel = channel;
    next();
  } catch (error) {
    console.error('❌ [requireChannelOwner] error:', error);
    return sendError(res, 500, 'Channel verification failed');
  }
};

module.exports = {
  verifyFirebaseToken,
  optionalFirebaseToken,
  requireRole,
  requireChannelOwner,
};