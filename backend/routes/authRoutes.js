// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, optionalFirebaseToken } = require('../middleware/verifyFirebaseToken');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  register,
  login,
  getCurrentUser,
  verifyEmail,
  resetPassword,
  googleLogin,
  logout,
  refreshToken,
  checkEmailOwnership,
} = require('../controllers/authController');

// Public routes
router.post('/register', optionalFirebaseToken, asyncHandler(register));
router.post('/login', optionalFirebaseToken, asyncHandler(login));
router.post('/google', asyncHandler(googleLogin));
router.post('/reset-password', asyncHandler(resetPassword));
router.get('/check-email', asyncHandler(checkEmailOwnership));

// Protected routes
router.get('/me', verifyFirebaseToken, asyncHandler(getCurrentUser));
router.post('/verify-email', verifyFirebaseToken, asyncHandler(verifyEmail));
router.post('/logout', verifyFirebaseToken, asyncHandler(logout));
router.post('/refresh-token', verifyFirebaseToken, asyncHandler(refreshToken));

module.exports = router;