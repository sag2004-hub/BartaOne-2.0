// backend/routes/videoRoutes.js
const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, optionalFirebaseToken } = require('../middleware/verifyFirebaseToken');
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

// ─── Public routes (no auth required) ──────────────────────────────────────
router.get('/', asyncHandler(getAllVideos));
router.get('/category/:category', asyncHandler(getVideosByCategory));
router.get('/channel/:channelId', asyncHandler(getVideosByChannel));

// ─── Public route with OPTIONAL auth (for like status) ────────────────────
router.get('/:id', optionalFirebaseToken, asyncHandler(getVideoById));

// ─── Public comment viewing ────────────────────────────────────────────────
router.get('/:id/comments', asyncHandler(getComments));

// ─── Protected routes - require authentication ─────────────────────────────
router.use(verifyFirebaseToken);

// ─── Upload routes ──────────────────────────────────────────────────────────
router.post('/', uploadVideoMedia(), asyncHandler(uploadVideo));
router.put('/:id', uploadVideoMedia(), asyncHandler(updateVideo));
router.delete('/:id', asyncHandler(deleteVideo));

// ─── Like routes ────────────────────────────────────────────────────────────
router.post('/:id/like', asyncHandler(likeVideo));
router.delete('/:id/like', asyncHandler(unlikeVideo));

// ─── Comment routes ─────────────────────────────────────────────────────────
router.post('/:id/comments', asyncHandler(addComment));

module.exports = router;