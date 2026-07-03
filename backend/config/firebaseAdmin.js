const dotenv = require("dotenv");
dotenv.config();

const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

if (!getApps().length) {
  if (!process.env.FIREBASE_PROJECT_ID) throw new Error("FIREBASE_PROJECT_ID is missing");
  if (!process.env.FIREBASE_CLIENT_EMAIL) throw new Error("FIREBASE_CLIENT_EMAIL is missing");
  if (!process.env.FIREBASE_PRIVATE_KEY) throw new Error("FIREBASE_PRIVATE_KEY is missing");

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  console.log("✅ Firebase Admin initialized for project:", process.env.FIREBASE_PROJECT_ID);
}

module.exports = { getAuth };