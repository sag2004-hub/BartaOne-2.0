const User = require('../models/User');
const { sendResponse, sendError } = require('../utils/response');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendResponse(res, 200, true, 'Profile fetched successfully', user);
  } catch (error) {
    console.error('Get profile error:', error);
    return sendError(res, 500, error.message);
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const { name, phone, location, preferredLanguage, profilePicture } = req.body;

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (profilePicture) user.profilePicture = profilePicture;

    user.updatedAt = new Date();
    await user.save();

    return sendResponse(res, 200, true, 'Profile updated successfully', user);
  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, 500, error.message);
  }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const { preferences } = req.body;

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Update preferences
    user.preferences = { ...user.preferences, ...preferences };
    user.updatedAt = new Date();
    await user.save();

    return sendResponse(res, 200, true, 'Preferences updated successfully', user);
  } catch (error) {
    console.error('Update preferences error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get saved articles
exports.getSavedArticles = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid }).populate('savedArticles');
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendResponse(res, 200, true, 'Saved articles fetched successfully', user.savedArticles);
  } catch (error) {
    console.error('Get saved articles error:', error);
    return sendError(res, 500, error.message);
  }
};

// Save article
exports.saveArticle = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    const { articleId } = req.params;

    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    if (!user.savedArticles.includes(articleId)) {
      user.savedArticles.push(articleId);
      await user.save();
    }

    return sendResponse(res, 200, true, 'Article saved successfully');
  } catch (error) {
    console.error('Save article error:', error);
    return sendError(res, 500, error.message);
  }
};

// Unsave article
exports.unsaveArticle = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    const { articleId } = req.params;

    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    user.savedArticles = user.savedArticles.filter(id => id.toString() !== articleId);
    await user.save();

    return sendResponse(res, 200, true, 'Article unsaved successfully');
  } catch (error) {
    console.error('Unsave article error:', error);
    return sendError(res, 500, error.message);
  }
};

// Get reading history
exports.getReadingHistory = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid }).populate('readingHistory');
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendResponse(res, 200, true, 'Reading history fetched successfully', user.readingHistory);
  } catch (error) {
    console.error('Get reading history error:', error);
    return sendError(res, 500, error.message);
  }
};

// Clear reading history
exports.clearHistory = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    user.readingHistory = [];
    await user.save();

    return sendResponse(res, 200, true, 'Reading history cleared successfully');
  } catch (error) {
    console.error('Clear history error:', error);
    return sendError(res, 500, error.message);
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    if (!firebaseUid) {
      return sendError(res, 401, 'Unauthorized');
    }

    // Delete from Firebase
    await admin.auth().deleteUser(firebaseUid);

    // Delete from our database
    await User.findOneAndDelete({ firebaseUid });

    return sendResponse(res, 200, true, 'Account deleted successfully');
  } catch (error) {
    console.error('Delete account error:', error);
    return sendError(res, 500, error.message);
  }
};