const express = require('express');
const router = express.Router();
const { optionalFirebaseToken } = require('../middleware/verifyFirebaseToken');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  translate,
  translateBatch,
  translateArticle,
  detectLanguage,
  getTranslationStatus,
} = require('../controllers/translateController');

// All translation routes are public (with optional auth for rate limiting)
router.use(optionalFirebaseToken);

// Translation endpoints
router.post('/translate', asyncHandler(translate));
router.post('/batch', asyncHandler(translateBatch));
router.post('/article', asyncHandler(translateArticle));
router.post('/detect', asyncHandler(detectLanguage));
router.get('/status', asyncHandler(getTranslationStatus));

module.exports = router;