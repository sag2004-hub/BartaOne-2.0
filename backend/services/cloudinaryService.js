const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload a file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} folder - Folder path in Cloudinary
 * @param {Object} options - Additional Cloudinary options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: folder,
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Upload an image to Cloudinary
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} folder - Folder path
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Upload result
 */
const uploadImage = (fileBuffer, folder, options = {}) => {
  return uploadToCloudinary(fileBuffer, folder, {
    resource_type: 'image',
    ...options,
  });
};

/**
 * Upload a video to Cloudinary
 * @param {Buffer} fileBuffer - Video buffer
 * @param {string} folder - Folder path
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Upload result
 */
const uploadVideo = (fileBuffer, folder, options = {}) => {
  return uploadToCloudinary(fileBuffer, folder, {
    resource_type: 'video',
    ...options,
  });
};

/**
 * Upload a file with custom options
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} folder - Folder path
 * @param {Object} options - Cloudinary options
 * @returns {Promise<Object>} - Upload result
 */
const uploadFile = (fileBuffer, folder, options = {}) => {
  return uploadToCloudinary(fileBuffer, folder, options);
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @returns {Promise<Object>} - Deletion result
 */
const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error('Cloudinary delete error:', error);
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

/**
 * Delete multiple files from Cloudinary
 * @param {string[]} publicIds - Array of public IDs
 * @returns {Promise<Object[]>} - Deletion results
 */
const deleteMultipleFromCloudinary = async (publicIds) => {
  const results = [];
  for (const publicId of publicIds) {
    try {
      const result = await deleteFromCloudinary(publicId);
      results.push(result);
    } catch (error) {
      console.error(`Failed to delete ${publicId}:`, error);
      results.push({ publicId, error: error.message });
    }
  }
  return results;
};

/**
 * Get image URL with transformations
 * @param {string} publicId - Public ID
 * @param {Object} transformations - Transformations object
 * @returns {string} - Transformed URL
 */
const getImageUrl = (publicId, transformations = {}) => {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = transformations;

  let url = cloudinary.url(publicId, {
    crop: crop,
    quality: quality,
    fetch_format: format,
  });

  if (width && height) {
    url = cloudinary.url(publicId, {
      width: width,
      height: height,
      crop: crop,
      quality: quality,
      fetch_format: format,
    });
  }

  return url;
};

/**
 * Get video thumbnail URL
 * @param {string} publicId - Public ID of video
 * @param {number} seconds - Time in seconds for thumbnail
 * @returns {string} - Thumbnail URL
 */
const getVideoThumbnail = (publicId, seconds = 1) => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: [
      { start_offset: seconds },
      { width: 640, height: 360, crop: 'fill' },
    ],
  });
};

/**
 * Upload image with optimization
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} folder - Folder path
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Upload result
 */
const uploadOptimizedImage = (fileBuffer, folder, options = {}) => {
  return uploadToCloudinary(fileBuffer, folder, {
    resource_type: 'image',
    transformation: [
      { quality: 'auto:best' },
      { fetch_format: 'auto' },
    ],
    ...options,
  });
};

/**
 * Upload profile image with specific dimensions
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} userId - User ID for folder
 * @returns {Promise<Object>} - Upload result
 */
const uploadProfileImage = (fileBuffer, userId) => {
  return uploadToCloudinary(fileBuffer, `users/${userId}/profile`, {
    resource_type: 'image',
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto:best' },
      { fetch_format: 'auto' },
    ],
  });
};

/**
 * Upload channel logo
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} channelId - Channel ID for folder
 * @returns {Promise<Object>} - Upload result
 */
const uploadChannelLogo = (fileBuffer, channelId) => {
  return uploadToCloudinary(fileBuffer, `channels/${channelId}/logo`, {
    resource_type: 'image',
    transformation: [
      { width: 300, height: 300, crop: 'fill' },
      { quality: 'auto:best' },
      { fetch_format: 'auto' },
    ],
  });
};

/**
 * Upload channel banner
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} channelId - Channel ID for folder
 * @returns {Promise<Object>} - Upload result
 */
const uploadChannelBanner = (fileBuffer, channelId) => {
  return uploadToCloudinary(fileBuffer, `channels/${channelId}/banner`, {
    resource_type: 'image',
    transformation: [
      { width: 1200, height: 400, crop: 'fill' },
      { quality: 'auto:best' },
      { fetch_format: 'auto' },
    ],
  });
};

/**
 * Upload article image
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} articleId - Article ID for folder
 * @returns {Promise<Object>} - Upload result
 */
const uploadArticleImage = (fileBuffer, articleId) => {
  return uploadToCloudinary(fileBuffer, `articles/${articleId}/images`, {
    resource_type: 'image',
    transformation: [
      { width: 1200, height: 800, crop: 'fill' },
      { quality: 'auto:best' },
      { fetch_format: 'auto' },
    ],
  });
};

/**
 * Upload video thumbnail
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} videoId - Video ID for folder
 * @returns {Promise<Object>} - Upload result
 */
const uploadVideoThumbnail = (fileBuffer, videoId) => {
  return uploadToCloudinary(fileBuffer, `videos/${videoId}/thumbnails`, {
    resource_type: 'image',
    transformation: [
      { width: 640, height: 360, crop: 'fill' },
      { quality: 'auto:best' },
      { fetch_format: 'auto' },
    ],
  });
};

/**
 * Upload live stream thumbnail
 * @param {Buffer} fileBuffer - Image buffer
 * @param {string} liveId - Live ID for folder
 * @returns {Promise<Object>} - Upload result
 */
const uploadLiveThumbnail = (fileBuffer, liveId) => {
  return uploadToCloudinary(fileBuffer, `live/${liveId}/thumbnails`, {
    resource_type: 'image',
    transformation: [
      { width: 1280, height: 720, crop: 'fill' },
      { quality: 'auto:best' },
      { fetch_format: 'auto' },
    ],
  });
};

module.exports = {
  uploadToCloudinary,
  uploadImage,
  uploadVideo,
  uploadFile,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  getImageUrl,
  getVideoThumbnail,
  uploadOptimizedImage,
  uploadProfileImage,
  uploadChannelLogo,
  uploadChannelBanner,
  uploadArticleImage,
  uploadVideoThumbnail,
  uploadLiveThumbnail,
};