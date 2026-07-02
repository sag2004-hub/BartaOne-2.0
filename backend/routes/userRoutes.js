const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  getProfile,
  updateProfile,
  updatePreferences,
  getSavedArticles,
  saveArticle,
  unsaveArticle,
  getReadingHistory,
  clearHistory,
  deleteAccount,
} = require('../controllers/userController');

// All routes require authentication
router.use(verifyFirebaseToken);

// Profile routes
router.get('/profile', asyncHandler(getProfile));
router.put('/profile', asyncHandler(updateProfile));
router.put('/preferences', asyncHandler(updatePreferences));

// Saved articles routes
router.get('/saved-articles', asyncHandler(getSavedArticles));
router.post('/save-article/:articleId', asyncHandler(saveArticle));
router.delete('/save-article/:articleId', asyncHandler(unsaveArticle));

// Reading history routes
router.get('/reading-history', asyncHandler(getReadingHistory));
router.delete('/reading-history', asyncHandler(clearHistory));

// Account management
router.delete('/account', asyncHandler(deleteAccount));

module.exports = router;