// backend/routes/videoRoutes.js
const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken');
const { uploadVideoMedia } = require('../middleware/uploadMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  getAllVideos,
  getVideoById,
  getVideosByChannel,
  getVideosByCategory,
  uploadVideo,
  updateVideo,
  deleteVideo,
  likeVideo,
  unlikeVideo,
  addComment,
  getComments,
} = require('../controllers/videoController');

// Public routes
router.get('/', asyncHandler(getAllVideos));
router.get('/category/:category', asyncHandler(getVideosByCategory));
router.get('/channel/:channelId', asyncHandler(getVideosByChannel));
router.get('/:id', asyncHandler(getVideoById));

// Comment routes (public for viewing)
router.get('/:id/comments', asyncHandler(getComments));

// Protected routes - require authentication
router.use(verifyFirebaseToken);

// ─── FIXED: Use uploadVideoMedia() which returns the middleware function ────
router.post('/', uploadVideoMedia(), asyncHandler(uploadVideo));
router.put('/:id', uploadVideoMedia(), asyncHandler(updateVideo));
router.delete('/:id', asyncHandler(deleteVideo));

// Like routes
router.post('/:id/like', asyncHandler(likeVideo));
router.delete('/:id/like', asyncHandler(unlikeVideo));

// Comment routes
router.post('/:id/comments', asyncHandler(addComment));

module.exports = router;