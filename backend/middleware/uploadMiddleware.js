const multer = require('multer');
const path = require('path');
const { sendError } = require('../utils/response');

// Configure storage
const storage = multer.memoryStorage();

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// File filter for videos
const videoFileFilter = (req, file, cb) => {
  const allowedTypes = /mp4|mov|avi|mkv|webm|flv|wmv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed (mp4, mov, avi, mkv, webm)'));
  }
};

// File filter for images and videos
const mediaFileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  const videoTypes = /mp4|mov|avi|mkv|webm|flv|wmv/;
  const extname = imageTypes.test(path.extname(file.originalname).toLowerCase()) || 
                  videoTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = imageTypes.test(file.mimetype) || videoTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'));
  }
};

// Create multer instances
const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5,
  },
  fileFilter: imageFileFilter,
});

const uploadVideo = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 2,
  },
  fileFilter: videoFileFilter,
});

const uploadMedia = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 5,
  },
  fileFilter: mediaFileFilter,
});

// Generic upload with custom config
const upload = (config = {}) => {
  const {
    fileSize = 10 * 1024 * 1024, // 10MB default
    files = 5,
    fileFilter = mediaFileFilter,
  } = config;

  return multer({
    storage: storage,
    limits: {
      fileSize: fileSize,
      files: files,
    },
    fileFilter: fileFilter,
  });
};

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 400, 'File too large. Maximum size exceeded.');
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return sendError(res, 400, 'Too many files. Maximum count exceeded.');
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return sendError(res, 400, 'Unexpected field name.');
    }
    return sendError(res, 400, `Upload error: ${err.message}`);
  }
  
  if (err) {
    return sendError(res, 400, err.message);
  }
  
  next();
};

// Specific upload middlewares
const uploadSingleImage = (fieldName = 'image') => {
  return [uploadImage.single(fieldName), handleMulterError];
};

const uploadMultipleImages = (fieldName = 'images', maxCount = 5) => {
  return [uploadImage.array(fieldName, maxCount), handleMulterError];
};

const uploadSingleVideo = (fieldName = 'video') => {
  return [uploadVideo.single(fieldName), handleMulterError];
};

const uploadChannelMedia = () => {
  return [
    uploadMedia.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
    handleMulterError,
  ];
};

const uploadArticleMedia = () => {
  return [
    uploadMedia.fields([
      { name: 'image', maxCount: 1 },
    ]),
    handleMulterError,
  ];
};

const uploadVideoMedia = () => {
  return [
    uploadMedia.fields([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
    handleMulterError,
  ];
};

module.exports = {
  uploadImage,
  uploadVideo,
  uploadMedia,
  upload,
  handleMulterError,
  uploadSingleImage,
  uploadMultipleImages,
  uploadSingleVideo,
  uploadChannelMedia,
  uploadArticleMedia,
  uploadVideoMedia,
  imageFileFilter,
  videoFileFilter,
  mediaFileFilter,
};