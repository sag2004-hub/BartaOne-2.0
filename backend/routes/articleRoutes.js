// backend/routes/articleRoutes.js
const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadArticleImage } = require('../middleware/uploadMiddleware'); // ← Use uploadArticleImage
const {
  getAllArticles,
  getArticleById,
  getArticlesByChannel,
  getArticlesByCategory,
  getTrendingArticles,
  getLatestArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  likeArticle,
  unlikeArticle,
  addComment,
  getComments,
  searchArticles,
} = require('../controllers/articleController');

// Public routes
router.get('/', asyncHandler(getAllArticles));
router.get('/search', asyncHandler(searchArticles));
router.get('/trending', asyncHandler(getTrendingArticles));
router.get('/latest', asyncHandler(getLatestArticles));
router.get('/category/:category', asyncHandler(getArticlesByCategory));
router.get('/channel/:channelId', asyncHandler(getArticlesByChannel));
router.get('/:id', asyncHandler(getArticleById));

// Comment routes (public for viewing)
router.get('/:id/comments', asyncHandler(getComments));

// Protected routes - require authentication
router.use(verifyFirebaseToken);

// ─── FIXED: Use uploadArticleImage middleware ───────────────────────────────
// uploadArticleImage is a single middleware that handles single image upload
router.post('/', uploadArticleImage, asyncHandler(createArticle));
router.put('/:id', uploadArticleImage, asyncHandler(updateArticle));
router.delete('/:id', asyncHandler(deleteArticle));

// Like routes
router.post('/:id/like', asyncHandler(likeArticle));
router.delete('/:id/like', asyncHandler(unlikeArticle));

// Comment routes
router.post('/:id/comments', asyncHandler(addComment));

module.exports = router;