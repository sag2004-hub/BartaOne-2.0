const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken');
const { uploadArticleMedia } = require('../middleware/uploadMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
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

// Article CRUD
router.post('/', uploadArticleMedia, asyncHandler(createArticle));
router.put('/:id', uploadArticleMedia, asyncHandler(updateArticle));
router.delete('/:id', asyncHandler(deleteArticle));

// Like routes
router.post('/:id/like', asyncHandler(likeArticle));
router.delete('/:id/like', asyncHandler(unlikeArticle));

// Comment routes
router.post('/:id/comments', asyncHandler(addComment));

module.exports = router;