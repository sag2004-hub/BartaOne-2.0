const dotenv = require("dotenv");
dotenv.config();

const admin = require("firebase-admin");

// Initialize Firebase Admin only once
if (!admin.getApps().length) {
  // Validate required environment variables
  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error("FIREBASE_PROJECT_ID is missing");
  }

  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error("FIREBASE_CLIENT_EMAIL is missing");
  }

  if (!process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error("FIREBASE_PRIVATE_KEY is missing");
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };

  admin.initializeApp({
    credential: admin.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin initialized successfully");
}

module.exports = admin;