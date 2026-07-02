const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken');
const { uploadSingleImage } = require('../middleware/uploadMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  getAllLiveStreams,
  getLiveStreamById,
  getLiveStreamsByChannel,
  startLiveStream,
  endLiveStream,
  updateLiveStream,
  getViewers,
} = require('../controllers/liveController');

// Public routes
router.get('/', asyncHandler(getAllLiveStreams));
router.get('/:id', asyncHandler(getLiveStreamById));
router.get('/channel/:channelId', asyncHandler(getLiveStreamsByChannel));
router.get('/:id/viewers', asyncHandler(getViewers));

// Protected routes - require authentication
router.use(verifyFirebaseToken);

// Live stream management
router.post('/start', uploadSingleImage('thumbnail'), asyncHandler(startLiveStream));
router.post('/:id/end', asyncHandler(endLiveStream));
router.put('/:id', uploadSingleImage('thumbnail'), asyncHandler(updateLiveStream));

module.exports = router;