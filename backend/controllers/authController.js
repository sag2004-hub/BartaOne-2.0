const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/response');
const { USER_ROLES } = require('../utils/constants');

// Register user
exports.register = async (req, res) => {
  try {
    const { email, password, name, role = USER_ROLES.VIEWER, phone, location } = req.body;

    // Check if user already exists in our database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, 'User already exists');
    }

    // User will be created in Firebase first, then we store in our DB
    // This endpoint expects the user to already be authenticated with Firebase
    // We'll use the Firebase UID from the token

    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized - No Firebase UID found');
    }

    // Create user in our database
    const user = new User({
      firebaseUid,
      email,
      name,
      role,
      phone,
      location,
      isVerified: req.user?.email_verified || false,
    });

    await user.save();

    // Generate custom token for the user
    const customToken = await admin.auth().createCustomToken(firebaseUid);

    return sendResponse(res, 201, true, 'User registered successfully', {
      user,
      token: customToken,
    });
  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, 500, error.message);
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email } = req.body;
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized - No Firebase UID found');
    }

    // Find user in database
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      // Create user if not exists (first time login)
      const newUser = new User({
        firebaseUid,
        email,
        name: req.user?.name || email.split('@')[0],
        role: USER_ROLES.VIEWER,
        isVerified: req.user?.email_verified || false,
      });
      await newUser.save();
      
      return sendResponse(res, 200, true, 'Login successful', {
        user: newUser,
        isNewUser: true,
      });
    }

    return sendResponse(res, 200, true, 'Login successful', {
      user,
      isNewUser: false,
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendResponse(res, 200, true, 'User fetched successfully', user);
  } catch (error) {
    console.error('Get current user error:', error);
    return sendError(res, 500, error.message);
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify the email verification token with Firebase
    // This is handled by Firebase, we just update our database
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Check if email is verified in Firebase
    const firebaseUser = await admin.auth().getUser(firebaseUid);
    if (firebaseUser.emailVerified) {
      user.isVerified = true;
      await user.save();
      return sendResponse(res, 200, true, 'Email verified successfully', user);
    }

    return sendError(res, 400, 'Email not verified yet');
  } catch (error) {
    console.error('Verify email error:', error);
    return sendError(res, 500, error.message);
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'Email is required');
    }

    // Firebase handles password reset
    // This endpoint just initiates the process
    await admin.auth().generatePasswordResetLink(email);

    return sendResponse(res, 200, true, 'Password reset link sent to your email');
  } catch (error) {
    console.error('Reset password error:', error);
    return sendError(res, 500, error.message);
  }
};

// Google Login
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return sendError(res, 400, 'ID token is required');
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;
    const name = decodedToken.name || email.split('@')[0];

    // Find or create user
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      user = new User({
        firebaseUid,
        email,
        name,
        role: USER_ROLES.VIEWER,
        isVerified: decodedToken.email_verified || false,
        profilePicture: decodedToken.picture || null,
      });
      await user.save();
    }

    return sendResponse(res, 200, true, 'Google login successful', user);
  } catch (error) {
    console.error('Google login error:', error);
    return sendError(res, 500, error.message);
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    // Firebase handles logout on client side
    // This endpoint just acknowledges the logout
    return sendResponse(res, 200, true, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    return sendError(res, 500, error.message);
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Generate new custom token
    const customToken = await admin.auth().createCustomToken(firebaseUid);

    return sendResponse(res, 200, true, 'Token refreshed successfully', {
      token: customToken,
      user,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return sendError(res, 500, error.message);
  }
};