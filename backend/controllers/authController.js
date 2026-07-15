// backend/controllers/authController.js
const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const { 
  sendResponse, 
  sendSuccess, 
  sendCreated, 
  sendError, 
  sendBadRequest, 
  sendUnauthorized, 
  sendNotFound,
  sendInternalError 
} = require('../utils/response');
const { 
  USER_ROLES, 
  HTTP_STATUS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES 
} = require('../utils/constants');

// ========================= CHECK EMAIL OWNERSHIP =========================
exports.checkEmailOwnership = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return sendBadRequest(res, 'Email is required');
    }

    console.log('🔍 Checking email ownership:', email);

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists with this email and has owner role
    const ownerUser = await User.findOne({ 
      email: normalizedEmail,
      role: USER_ROLES.OWNER
    });

    // Check if user exists with this email and has viewer role
    const viewerUser = await User.findOne({ 
      email: normalizedEmail,
      role: USER_ROLES.VIEWER
    });

    // Check if user exists with this email and has admin role
    const adminUser = await User.findOne({ 
      email: normalizedEmail,
      role: USER_ROLES.ADMIN
    });

    const isOwner = !!ownerUser;
    const isViewer = !!viewerUser;
    const isAdmin = !!adminUser;

    let message = 'Email is available for registration';
    let role = null;

    if (isOwner) {
      message = 'This email is already registered as a channel owner';
      role = 'owner';
    } else if (isViewer) {
      message = 'This email is already registered as a viewer. Please use a different company email.';
      role = 'viewer';
    } else if (isAdmin) {
      message = 'This email is already registered as an admin';
      role = 'admin';
    }

    return sendSuccess(res, {
      isOwner,
      isViewer,
      isAdmin,
      email: normalizedEmail,
      message,
      role
    });

  } catch (error) {
    console.error('❌ Check Email Ownership Error:', error);
    return sendInternalError(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
};

// ========================= REGISTER =========================
exports.register = async (req, res) => {
  try {
    console.log('📝 ===== REGISTER REQUEST =====');
    console.log('📝 Body:', req.body);
    console.log('📝 User object:', req.user);
    console.log('📝 User UID:', req.user?.uid);

    const { email, name, role = USER_ROLES.VIEWER, phone, location } = req.body;
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      console.error('❌ No Firebase UID found in request');
      return sendUnauthorized(res, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    console.log('🔑 Firebase UID:', firebaseUid);
    console.log('📝 Creating user with:', { firebaseUid, email, name, role, phone });

    // ✅ Check if email is already registered as owner
    const existingOwner = await User.findOne({ 
      email: email.toLowerCase().trim(),
      role: USER_ROLES.OWNER
    });

    if (existingOwner) {
      console.log('⚠️ Email already registered as owner:', email);
      return sendBadRequest(res, {
        message: 'This email is already registered as a channel owner. Please login to your owner account.',
        code: 'EMAIL_ALREADY_OWNER'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUid });
    console.log('🔍 User found:', user ? 'YES' : 'NO');

    if (user) {
      console.log('✅ User already exists:', user._id);
      return sendResponse(res, HTTP_STATUS.OK, true, 'User already registered', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      console.log('⚠️ Email already registered:', email);
      return sendBadRequest(res, ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Create new user
    console.log('📝 Creating new user in MongoDB...');
    user = await User.create({
      firebaseUid,
      email,
      name: name || email.split('@')[0],
      role: role || USER_ROLES.VIEWER,
      phone: phone || '',
      location: location || {},
      isVerified: req.user?.email_verified || false,
    });
    console.log('✅ User created successfully:', user._id);

    return sendCreated(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    }, SUCCESS_MESSAGES.REGISTER_SUCCESS);

  } catch (error) {
    console.error('❌ ===== REGISTER ERROR =====');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    
    // Check for specific MongoDB errors
    if (error.code === 11000) {
      console.error('❌ Duplicate key error!');
      return sendBadRequest(res, ERROR_MESSAGES.DUPLICATE_ENTRY);
    }
    
    return sendInternalError(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
};

// ========================= LOGIN =========================
exports.login = async (req, res) => {
  try {
    console.log('🔐 ===== LOGIN REQUEST =====');
    console.log('📝 Body:', req.body);
    console.log('📝 User object:', req.user);

    const { email } = req.body;
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      console.error('❌ No Firebase UID found');
      return sendUnauthorized(res, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    console.log('🔑 Firebase UID:', firebaseUid);

    let user = await User.findOne({ firebaseUid });
    console.log('🔍 User found:', user ? '✅ YES' : '❌ NO');

    if (!user) {
      console.log('📝 Creating user on first login...');
      user = await User.create({
        firebaseUid,
        email,
        name: req.user?.name || req.user?.displayName || email?.split('@')[0] || 'User',
        role: USER_ROLES.VIEWER,
        isVerified: req.user?.email_verified || false,
      });
      console.log('✅ User created:', user._id);

      return sendCreated(res, {
        user,
        isNewUser: true,
      }, SUCCESS_MESSAGES.LOGIN_SUCCESS);
    }

    // Update verification status and last login
    user.isVerified = req.user?.email_verified || user.isVerified;
    user.lastLogin = new Date();
    await user.save();

    return sendSuccess(res, {
      user,
      isNewUser: false,
    }, SUCCESS_MESSAGES.LOGIN_SUCCESS);

  } catch (error) {
    console.error('❌ Login Error:', error);
    return sendInternalError(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
};

// ========================= CURRENT USER =========================
exports.getCurrentUser = async (req, res) => {
  try {
    console.log('👤 ===== GET CURRENT USER =====');
    console.log('📝 User UID:', req.user?.uid);

    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return sendUnauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      console.log('❌ User not found for UID:', firebaseUid);
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    console.log('✅ User found:', user._id);
    return sendSuccess(res, user, 'User fetched successfully');

  } catch (error) {
    console.error('❌ Current User Error:', error);
    return sendInternalError(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
};

// ========================= VERIFY EMAIL =========================
exports.verifyEmail = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return sendUnauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const firebaseUser = await admin.getAuth().getUser(firebaseUid);
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    user.isVerified = firebaseUser.emailVerified;
    await user.save();

    return sendSuccess(res, user, SUCCESS_MESSAGES.EMAIL_VERIFIED);

  } catch (error) {
    console.error('❌ Verify Email Error:', error);
    return sendInternalError(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
};

// ========================= RESET PASSWORD =========================
exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendBadRequest(res, 'Email is required');
    }

    const link = await admin.getAuth().generatePasswordResetLink(email);

    return sendSuccess(res, { link }, SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS);

  } catch (error) {
    console.error('❌ Reset Password Error:', error);
    return sendInternalError(res, ERROR_MESSAGES.PASSWORD_RESET_FAILED);
  }
};

// ========================= GOOGLE LOGIN =========================
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    const decoded = await admin.getAuth().verifyIdToken(idToken);

    let user = await User.findOne({
      firebaseUid: decoded.uid,
    });

    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email,
        name: decoded.name || decoded.email?.split('@')[0] || 'User',
        profilePicture: decoded.picture,
        role: USER_ROLES.VIEWER,
        isVerified: decoded.email_verified || false,
      });
    }

    return sendSuccess(res, user, SUCCESS_MESSAGES.LOGIN_SUCCESS);

  } catch (error) {
    console.error('❌ Google Login Error:', error);
    return sendInternalError(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
};

// ========================= LOGOUT =========================
exports.logout = async (req, res) => {
  return sendSuccess(res, null, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
};

// ========================= REFRESH TOKEN =========================
exports.refreshToken = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return sendUnauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const token = await admin.getAuth().createCustomToken(firebaseUid);

    return sendSuccess(res, { token, user }, 'Token refreshed');

  } catch (error) {
    console.error('❌ Refresh Token Error:', error);
    return sendInternalError(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
};

// ========================= UPDATE PROFILE =========================
exports.updateProfile = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    const { name, phone, location, preferredLanguage } = req.body;

    if (!firebaseUid) {
      return sendUnauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;

    await user.save();

    return sendSuccess(res, user, SUCCESS_MESSAGES.PROFILE_UPDATED);

  } catch (error) {
    console.error('❌ Update Profile Error:', error);
    return sendInternalError(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
};

// ========================= UPDATE PREFERENCES =========================
exports.updatePreferences = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    const { preferences } = req.body;

    if (!firebaseUid) {
      return sendUnauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    return sendSuccess(res, user.preferences, SUCCESS_MESSAGES.PREFERENCES_UPDATED);

  } catch (error) {
    console.error('❌ Update Preferences Error:', error);
    return sendInternalError(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
};

// ========================= DELETE ACCOUNT =========================
exports.deleteAccount = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return sendUnauthorized(res, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return sendNotFound(res, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Delete from Firebase Auth
    await admin.getAuth().deleteUser(firebaseUid);

    // Delete from MongoDB
    await User.deleteOne({ firebaseUid });

    return sendSuccess(res, null, 'Account deleted successfully');

  } catch (error) {
    console.error('❌ Delete Account Error:', error);
    return sendInternalError(res, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
  }
};