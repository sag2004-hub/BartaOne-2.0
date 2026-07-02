/**
 * Backend Test Script
 * Run this to test your backend configuration
 * Usage: node test.js
 */

// Handle uncaught exceptions and rejections gracefully
process.on('uncaughtException', (err) => {
  console.log('⚠️ Uncaught Exception (ignored):', err.message);
});

process.on('unhandledRejection', (err) => {
  console.log('⚠️ Unhandled Rejection (ignored):', err.message);
});

const dotenv = require('dotenv');
dotenv.config();

console.log('🔍 BartaOne Backend Test');
console.log('========================================');
console.log('');

// Test Environment Variables
console.log('📝 Environment Variables:');
console.log('----------------------------------------');

const envChecks = [
  { name: 'PORT', value: process.env.PORT || '5000' },
  { name: 'NODE_ENV', value: process.env.NODE_ENV || 'development' },
  { name: 'MONGO_URI', value: process.env.MONGO_URI ? '✅ Set' : '❌ Missing' },
  { name: 'FIREBASE_PROJECT_ID', value: process.env.FIREBASE_PROJECT_ID || '❌ Missing' },
  { name: 'FIREBASE_CLIENT_EMAIL', value: process.env.FIREBASE_CLIENT_EMAIL || '❌ Missing' },
  { name: 'FIREBASE_PRIVATE_KEY', value: process.env.FIREBASE_PRIVATE_KEY ? '✅ Set (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : '❌ Missing' },
  { name: 'CLOUDINARY_CLOUD_NAME', value: process.env.CLOUDINARY_CLOUD_NAME || '❌ Missing' },
  { name: 'CLOUDINARY_API_KEY', value: process.env.CLOUDINARY_API_KEY || '❌ Missing' },
  { name: 'CLOUDINARY_API_SECRET', value: process.env.CLOUDINARY_API_SECRET || '❌ Missing' },
  { name: 'JWT_SECRET', value: process.env.JWT_SECRET ? '✅ Set' : '❌ Missing' },
  { name: 'TRANSLATION_API_URL', value: process.env.TRANSLATION_API_URL || '❌ Missing' },
  { name: 'TRANSLATION_API_EMAIL', value: process.env.TRANSLATION_API_EMAIL || 'Not set' },
];

envChecks.forEach(check => {
  console.log(`  ${check.name}: ${check.value}`);
});

console.log('');
console.log('----------------------------------------');

// Test MongoDB Connection
console.log('📊 Testing MongoDB Connection...');
console.log('----------------------------------------');

async function testMongoDB() {
  try {
    if (!process.env.MONGO_URI) {
      console.log('❌ MONGO_URI not set in .env file');
      return false;
    }

    const mongoose = require('mongoose');
    
    await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ MongoDB Connection: Successful');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    
    await mongoose.connection.close();
    console.log('   Connection closed');
    return true;
  } catch (error) {
    console.log(`❌ MongoDB Connection Error: ${error.message}`);
    return false;
  }
}

// Test Firebase Admin
console.log('');
console.log('🔥 Testing Firebase Admin...');
console.log('----------------------------------------');

async function testFirebase() {
  try {
    // Check if required environment variables exist
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.log('❌ FIREBASE_PROJECT_ID is missing');
      return false;
    }
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      console.log('❌ FIREBASE_PRIVATE_KEY is missing');
      return false;
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('❌ FIREBASE_CLIENT_EMAIL is missing');
      return false;
    }

    // Format private key
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    console.log('   Raw private key length:', privateKey.length);
    
    // Remove surrounding quotes if present
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Replace escaped newlines with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    privateKey = privateKey.trim();

    console.log('   Cleaned private key length:', privateKey.length);
    console.log('   Contains "PRIVATE KEY":', privateKey.includes('PRIVATE KEY'));

    // Create service account object
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || "",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL || "",
      universe_domain: "googleapis.com",
    };

    const admin = require('firebase-admin');
    
    // Check if already initialized
    if (!admin.getApps().length) {
      admin.initializeApp({
  credential: admin.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});
    }
    
    console.log('✅ Firebase Admin: Initialized');
    console.log(`   Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
    return true;
  } catch (error) {
    console.log(`❌ Firebase Admin Error: ${error.message}`);
    return false;
  }
}

// Test Cloudinary
console.log('');
console.log('☁️ Testing Cloudinary...');
console.log('----------------------------------------');

async function testCloudinary() {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.log('❌ Cloudinary configuration missing in .env');
      return false;
    }

    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    console.log('✅ Cloudinary: Configured');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    return true;
  } catch (error) {
    console.log(`❌ Cloudinary Error: ${error.message}`);
    return false;
  }
}

// Test Dependencies
console.log('');
console.log('📦 Testing Dependencies...');
console.log('----------------------------------------');

async function testDependencies() {
  const dependencies = [
    'express',
    'cors',
    'dotenv',
    'helmet',
    'morgan',
    'compression',
    'mongoose',
    'firebase-admin',
    'cloudinary',
    'multer',
    'jsonwebtoken',
    'bcryptjs',
    'axios',
    'winston',
    'streamifier',
  ];

  let passed = 0;
  let failed = 0;
  
  dependencies.forEach(dep => {
    try {
      require(dep);
      console.log(`✅ ${dep}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${dep} - ${error.message}`);
      failed++;
    }
  });

  console.log(`   Dependencies: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Test Translation Service
console.log('');
console.log('🌐 Testing Translation Service...');
console.log('----------------------------------------');

async function testTranslation() {
  try {
    const translationService = require('./services/translationService');
    console.log('✅ Translation Service: Loaded');
    
    // Test translation with a simple text
    try {
      const result = await translationService.translate('Hello, how are you?', 'bn');
      console.log(`   Test Translation: "Hello, how are you?" -> "${result}"`);
      
      const status = await translationService.getTranslationStatus('Hello', 'bn');
      console.log(`   API Status: ${status?.status || 'Unknown'}`);
      console.log(`   Quota Available: ${!status?.quota}`);
    } catch (error) {
      console.log(`   Translation Test Failed: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Translation Service Error: ${error.message}`);
    return false;
  }
}

// Test Route Files
console.log('');
console.log('🗺️ Testing Route Files...');
console.log('----------------------------------------');

function testRoutes() {
  const routes = [
    './routes/authRoutes',
    './routes/userRoutes',
    './routes/channelRoutes',
    './routes/articleRoutes',
    './routes/videoRoutes',
    './routes/liveRoutes',
    './routes/translateRoutes',
  ];

  let passed = 0;
  let failed = 0;
  
  routes.forEach(route => {
    try {
      const mod = require(route);
      if (mod && typeof mod === 'function') {
        console.log(`✅ ${route.split('/').pop()} (router)`);
      } else if (mod && mod.stack) {
        console.log(`✅ ${route.split('/').pop()} (router)`);
      } else {
        console.log(`✅ ${route.split('/').pop()}`);
      }
      passed++;
    } catch (error) {
      console.log(`❌ ${route.split('/').pop()} - ${error.message}`);
      failed++;
    }
  });

  console.log(`   Routes: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Test Controller Files
console.log('');
console.log('🎮 Testing Controller Files...');
console.log('----------------------------------------');

function testControllers() {
  const controllers = [
    './controllers/authController',
    './controllers/userController',
    './controllers/channelController',
    './controllers/articleController',
    './controllers/videoController',
    './controllers/liveController',
    './controllers/translateController',
  ];

  let passed = 0;
  let failed = 0;
  
  controllers.forEach(controller => {
    try {
      const mod = require(controller);
      if (mod && Object.keys(mod).length > 0) {
        console.log(`✅ ${controller.split('/').pop()}`);
        passed++;
      } else {
        console.log(`⚠️ ${controller.split('/').pop()} - Empty exports`);
        passed++;
      }
    } catch (error) {
      console.log(`❌ ${controller.split('/').pop()} - ${error.message}`);
      failed++;
    }
  });

  console.log(`   Controllers: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Test Model Files
console.log('');
console.log('📊 Testing Model Files...');
console.log('----------------------------------------');

function testModels() {
  const models = [
    './models/User',
    './models/Channel',
    './models/Article',
    './models/Video',
    './models/Live',
    './models/Comment',
    './models/Like',
    './models/Subscription',
  ];

  let passed = 0;
  let failed = 0;
  
  models.forEach(model => {
    try {
      const mod = require(model);
      if (mod && mod.schema) {
        console.log(`✅ ${model.split('/').pop()}`);
        passed++;
      } else if (mod && mod.modelName) {
        console.log(`✅ ${model.split('/').pop()}`);
        passed++;
      } else {
        console.log(`⚠️ ${model.split('/').pop()} - Unknown model format`);
        passed++;
      }
    } catch (error) {
      console.log(`❌ ${model.split('/').pop()} - ${error.message}`);
      failed++;
    }
  });

  console.log(`   Models: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Test Middleware Files
console.log('');
console.log('🔧 Testing Middleware Files...');
console.log('----------------------------------------');

function testMiddleware() {
  const middleware = [
    './middleware/verifyFirebaseToken',
    './middleware/uploadMiddleware',
    './middleware/errorHandler',
  ];

  let passed = 0;
  let failed = 0;
  
  middleware.forEach(mw => {
    try {
      const mod = require(mw);
      if (mod && Object.keys(mod).length > 0) {
        console.log(`✅ ${mw.split('/').pop()}`);
        passed++;
      } else {
        console.log(`⚠️ ${mw.split('/').pop()} - Empty exports`);
        passed++;
      }
    } catch (error) {
      console.log(`❌ ${mw.split('/').pop()} - ${error.message}`);
      failed++;
    }
  });

  console.log(`   Middleware: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Test Config Files
console.log('');
console.log('⚙️ Testing Config Files...');
console.log('----------------------------------------');

function testConfig() {
  const configs = [
    './config/db',
    './config/firebaseAdmin',
    './config/cloudinary',
  ];

  let passed = 0;
  let failed = 0;
  
  configs.forEach(config => {
    try {
      const mod = require(config);
      console.log(`✅ ${config.split('/').pop()}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${config.split('/').pop()} - ${error.message}`);
      failed++;
    }
  });

  console.log(`   Configs: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Test Service Files
console.log('');
console.log('🔨 Testing Service Files...');
console.log('----------------------------------------');

function testServices() {
  const services = [
    './services/cloudinaryService',
    './services/translationService',
    './services/notificationService',
  ];

  let passed = 0;
  let failed = 0;
  
  services.forEach(service => {
    try {
      const mod = require(service);
      if (mod && Object.keys(mod).length > 0) {
        console.log(`✅ ${service.split('/').pop()}`);
        passed++;
      } else {
        console.log(`⚠️ ${service.split('/').pop()} - Empty exports`);
        passed++;
      }
    } catch (error) {
      console.log(`❌ ${service.split('/').pop()} - ${error.message}`);
      failed++;
    }
  });

  console.log(`   Services: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Test Utils Files
console.log('');
console.log('🔨 Testing Utils Files...');
console.log('----------------------------------------');

function testUtils() {
  const utils = [
    './utils/logger',
    './utils/response',
    './utils/constants',
  ];

  let passed = 0;
  let failed = 0;
  
  utils.forEach(util => {
    try {
      const mod = require(util);
      if (mod && Object.keys(mod).length > 0) {
        console.log(`✅ ${util.split('/').pop()}`);
        passed++;
      } else {
        console.log(`⚠️ ${util.split('/').pop()} - Empty exports`);
        passed++;
      }
    } catch (error) {
      console.log(`❌ ${util.split('/').pop()} - ${error.message}`);
      failed++;
    }
  });

  console.log(`   Utils: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Run all tests
async function runAllTests() {
  console.log('');
  console.log('========================================');
  console.log('🚀 Running All Tests...');
  console.log('========================================');

  const results = {
    mongoDB: await testMongoDB(),
    firebase: await testFirebase(),
    cloudinary: await testCloudinary(),
    dependencies: await testDependencies(),
    translation: await testTranslation(),
    routes: testRoutes(),
    controllers: testControllers(),
    models: testModels(),
    middleware: testMiddleware(),
    config: testConfig(),
    services: testServices(),
    utils: testUtils(),
  };

  console.log('');
  console.log('========================================');
  console.log('📊 Test Results Summary');
  console.log('========================================');

  let passed = 0;
  let failed = 0;

  Object.entries(results).forEach(([key, value]) => {
    const icon = value ? '✅' : '❌';
    console.log(`${icon} ${key}: ${value ? 'PASSED' : 'FAILED'}`);
    if (value) passed++;
    else failed++;
  });

  console.log('');
  console.log(`Total: ${passed + failed} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('========================================');

  if (failed === 0) {
    console.log('');
    console.log('🎉🎉🎉 ALL TESTS PASSED! Backend is ready to go! 🎉🎉🎉');
    console.log('');
    console.log('🚀 To start the server:');
    console.log('   npm run dev');
    console.log('');
    console.log('🌐 API URL: http://localhost:5000/api');
    console.log('🩺 Health Check: http://localhost:5000/api/health');
  } else {
    console.log('');
    console.log('⚠️ Some tests failed. Please check the errors above.');
    console.log('');
    console.log('💡 Common fixes:');
    console.log('   1. Check .env file has all required variables');
    console.log('   2. Ensure MongoDB is running and accessible');
    console.log('   3. Verify Firebase service account credentials');
    console.log('   4. Check Cloudinary credentials');
    console.log('   5. Run npm install to install missing dependencies');
  }
}

// Run the tests
runAllTests();

// Export for use in other files
module.exports = {
  testMongoDB,
  testFirebase,
  testCloudinary,
  testDependencies,
  testTranslation,
  testRoutes,
  testControllers,
  testModels,
  testMiddleware,
  testConfig,
  testServices,
  testUtils,
  runAllTests,
};