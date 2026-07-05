// backend/routes/liveRoutes.js
const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken');
const { uploadSingleImage } = require('../middleware/uploadMiddleware');
const {
  getAllLiveStreams,
  getLiveStreamById,
  getLiveStreamsByChannel,
  startLiveStream,
  scheduleLiveStream,
  endLiveStream,
  updateLiveStream,
  getViewers,
} = require('../controllers/liveController');

// ─── Public routes ──────────────────────────────────────────────────────────
router.get('/', getAllLiveStreams);
router.get('/:id', getLiveStreamById);
router.get('/channel/:channelId', getLiveStreamsByChannel);
router.get('/:id/viewers', getViewers);

// ─── Thumbnail upload endpoint ─────────────────────────────────────────────
router.post('/upload/thumbnail', verifyFirebaseToken, uploadSingleImage('thumbnail'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided',
      });
    }

    // Upload to Cloudinary using the file buffer
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64Image}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'live/thumbnails',
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    });
    
    res.status(200).json({
      success: true,
      data: { url: result.secure_url },
    });
  } catch (error) {
    console.error('Thumbnail upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload thumbnail',
    });
  }
});

// ─── Protected routes ──────────────────────────────────────────────────────
router.use(verifyFirebaseToken);

router.post('/start', startLiveStream);
router.post('/schedule', scheduleLiveStream);
router.post('/:id/end', endLiveStream);
router.put('/:id', updateLiveStream);

module.exports = router;