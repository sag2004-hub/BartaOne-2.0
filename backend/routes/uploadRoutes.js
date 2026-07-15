const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken');
const { 
  uploadSingleImage, 
  uploadMultipleImages, 
  uploadSingleVideo,
  uploadChannelMedia,
  handleMulterError 
} = require('../middleware/uploadMiddleware');
const { sendResponse, sendError } = require('../utils/response');

// ─── Test route ──────────────────────────────────────────────────────────────
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Upload routes are working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/upload/test - This endpoint',
      'POST /api/upload/image - Upload single image',
      'POST /api/upload/images - Upload multiple images',
      'POST /api/upload/video - Upload video',
      'POST /api/upload/channel - Upload channel media'
    ]
  });
});

// ─── Upload single image ──────────────────────────────────────────────────────
router.post(
  '/image',
  verifyFirebaseToken,
  uploadSingleImage('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return sendError(res, 400, 'No image file provided');
      }

      console.log('📤 Uploading image to Cloudinary...');
      console.log('📁 File info:', {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'newspapers/images',
            resource_type: 'image',
            transformation: [
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        const { Readable } = require('stream');
        const bufferStream = Readable.from(req.file.buffer);
        bufferStream.pipe(uploadStream);
      });

      console.log('✅ Image uploaded to Cloudinary:', result.secure_url);

      sendResponse(res, 200, true, 'Image uploaded successfully', {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      });
    } catch (error) {
      console.error('❌ Image upload error:', error);
      sendError(res, 500, 'Failed to upload image', error.message);
    }
  },
  handleMulterError
);

// ─── Upload multiple images ──────────────────────────────────────────────────
router.post(
  '/images',
  verifyFirebaseToken,
  uploadMultipleImages('images', 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return sendError(res, 400, 'No image files provided');
      }

      console.log(`📤 Uploading ${req.files.length} images to Cloudinary...`);

      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'newspapers/images',
              resource_type: 'image',
              transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          const { Readable } = require('stream');
          const bufferStream = Readable.from(file.buffer);
          bufferStream.pipe(uploadStream);
        });
      });

      const results = await Promise.all(uploadPromises);
      
      const uploadedImages = results.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      }));

      console.log(`✅ ${uploadedImages.length} images uploaded successfully`);

      sendResponse(res, 200, true, 'Images uploaded successfully', {
        images: uploadedImages,
      });
    } catch (error) {
      console.error('❌ Multiple images upload error:', error);
      sendError(res, 500, 'Failed to upload images', error.message);
    }
  },
  handleMulterError
);

// ─── Upload video ────────────────────────────────────────────────────────────
router.post(
  '/video',
  verifyFirebaseToken,
  uploadSingleVideo('video'),
  async (req, res) => {
    try {
      if (!req.file) {
        return sendError(res, 400, 'No video file provided');
      }

      console.log('📤 Uploading video to Cloudinary...');
      console.log('📁 File info:', {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'newspapers/videos',
            resource_type: 'video',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        
        const { Readable } = require('stream');
        const bufferStream = Readable.from(req.file.buffer);
        bufferStream.pipe(uploadStream);
      });

      console.log('✅ Video uploaded to Cloudinary:', result.secure_url);

      sendResponse(res, 200, true, 'Video uploaded successfully', {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      });
    } catch (error) {
      console.error('❌ Video upload error:', error);
      sendError(res, 500, 'Failed to upload video', error.message);
    }
  },
  handleMulterError
);

// ─── Upload channel media (logo + banner) ──────────────────────────────────
router.post(
  '/channel',
  verifyFirebaseToken,
  uploadChannelMedia(),
  async (req, res) => {
    try {
      const uploadedFiles = {};

      // Upload logo
      if (req.files && req.files.logo && req.files.logo.length > 0) {
        const logoFile = req.files.logo[0];
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'channels/logos',
              resource_type: 'image',
              transformation: [
                { width: 500, height: 500, crop: 'fill' },
                { quality: 'auto:good' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          const { Readable } = require('stream');
          const bufferStream = Readable.from(logoFile.buffer);
          bufferStream.pipe(uploadStream);
        });
        
        uploadedFiles.logo = {
          url: result.secure_url,
          publicId: result.public_id,
        };
      }

      // Upload banner
      if (req.files && req.files.banner && req.files.banner.length > 0) {
        const bannerFile = req.files.banner[0];
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'channels/banners',
              resource_type: 'image',
              transformation: [
                { width: 1200, height: 400, crop: 'fill' },
                { quality: 'auto:good' },
              ],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          const { Readable } = require('stream');
          const bufferStream = Readable.from(bannerFile.buffer);
          bufferStream.pipe(uploadStream);
        });
        
        uploadedFiles.banner = {
          url: result.secure_url,
          publicId: result.public_id,
        };
      }

      sendResponse(res, 200, true, 'Channel media uploaded successfully', uploadedFiles);
    } catch (error) {
      console.error('❌ Channel media upload error:', error);
      sendError(res, 500, 'Failed to upload channel media', error.message);
    }
  },
  handleMulterError
);

module.exports = router;