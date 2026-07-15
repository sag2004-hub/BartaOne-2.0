const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { logRequest } = require('./utils/logger');

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));
app.use(logRequest);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'BartaOne API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Import routes ──────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const channelRoutes = require('./routes/channelRoutes');
const articleRoutes = require('./routes/articleRoutes');
const videoRoutes = require('./routes/videoRoutes');
// const liveRoutes = require('./routes/liveRoutes'); // ❌ REMOVED (replaced by newspaper)
const translateRoutes = require('./routes/translateRoutes');
const newspaperRoutes = require('./routes/newspaperRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); // ✅ ADDED

// ─── Use routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/videos', videoRoutes);
// app.use('/api/live', liveRoutes); // ❌ REMOVED (replaced by newspaper)
app.use('/api/translate', translateRoutes);
app.use('/api/newspapers', newspaperRoutes);
app.use('/api/upload', uploadRoutes); // ✅ ADDED

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// ─── Start server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📰 Newspapers API: http://localhost:${PORT}/api/newspapers`);
  console.log(`📤 Upload API: http://localhost:${PORT}/api/upload`);
});

// ─── Error handling ────────────────────────────────────────────────────────
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('💤 Process terminated!');
  });
});

module.exports = app;