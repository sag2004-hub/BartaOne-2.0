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

// Error handling helper for multer
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

// ─── FIXED: Specific upload middlewares ──────────────────────────────────────

// Upload single image - For articles (field name: 'image')
const uploadSingleImage = (fieldName = 'image') => {
  return (req, res, next) => {
    uploadImage.single(fieldName)(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  };
};

// Upload multiple images
const uploadMultipleImages = (fieldName = 'images', maxCount = 5) => {
  return (req, res, next) => {
    uploadImage.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  };
};

// Upload single video
const uploadSingleVideo = (fieldName = 'video') => {
  return (req, res, next) => {
    uploadVideo.single(fieldName)(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  };
};

// ─── FIXED: Upload channel media ─────────────────────────────────────────────
const uploadChannelMedia = () => {
  return (req, res, next) => {
    uploadMedia.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  };
};

// ─── FIXED: Upload article media (SINGLE image) ─────────────────────────────
// Using uploadImage.single() instead of uploadMedia.fields()
const uploadArticleMedia = () => {
  return (req, res, next) => {
    uploadImage.single('image')(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  };
};

// ─── FIXED: Upload video media ───────────────────────────────────────────────
const uploadVideoMedia = () => {
  return (req, res, next) => {
    uploadMedia.fields([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  };
};

// ─── ADD: Simple uploadArticleMedia as a single middleware ──────────────────
// This is what you'll use in your routes
const uploadArticleImage = uploadImage.single('image');

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
  uploadArticleImage, // ← Added this for simpler usage
  imageFileFilter,
  videoFileFilter,
  mediaFileFilter,
};