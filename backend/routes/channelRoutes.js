const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, requireChannelOwner } = require('../middleware/verifyFirebaseToken');
const { uploadChannelMedia } = require('../middleware/uploadMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  getAllChannels,
  getChannelById,
  getChannelByOwner,
  createChannel,
  updateChannel,
  deleteChannel,
  subscribeChannel,
  unsubscribeChannel,
  getSubscribers,
  getChannelStats,
} = require('../controllers/channelController');

// Public routes
router.get('/', asyncHandler(getAllChannels));
router.get('/:id', asyncHandler(getChannelById));
router.get('/:id/stats', asyncHandler(getChannelStats));

// Protected routes - require authentication
router.use(verifyFirebaseToken);

// Owner channel routes
router.get('/owner/my-channel', asyncHandler(getChannelByOwner));
router.post('/', uploadChannelMedia, asyncHandler(createChannel));
router.put('/:id', uploadChannelMedia, asyncHandler(updateChannel));
router.delete('/:id', asyncHandler(deleteChannel));

// Subscription routes
router.post('/:id/subscribe', asyncHandler(subscribeChannel));
router.delete('/:id/subscribe', asyncHandler(unsubscribeChannel));

// Subscribers routes
router.get('/subscribers/list', asyncHandler(getSubscribers));

module.exports = router;