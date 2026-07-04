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

// Protected routes - require authentication
router.use(verifyFirebaseToken);

// ⚠️ Literal routes MUST come before /:id dynamic routes
// Otherwise Express treats "owner" and "subscribers" as ObjectId values → 500 error
router.get('/owner', asyncHandler(getChannelByOwner));
router.get('/subscribers/list', asyncHandler(getSubscribers));

// Dynamic /:id routes — always last
router.get('/:id', asyncHandler(getChannelById));
router.get('/:id/stats', asyncHandler(getChannelStats));

router.post('/', ...uploadChannelMedia(), asyncHandler(createChannel));
router.put('/:id', ...uploadChannelMedia(), asyncHandler(updateChannel));
router.delete('/:id', asyncHandler(deleteChannel));

// Subscription routes
router.post('/:id/subscribe', asyncHandler(subscribeChannel));
router.delete('/:id/subscribe', asyncHandler(unsubscribeChannel));

module.exports = router;