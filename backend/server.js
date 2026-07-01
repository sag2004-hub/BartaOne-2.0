require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");

const admin = require("firebase-admin");

const app = express();
const server = http.createServer(app);

/* ===========================================================
   Middleware
=========================================================== */

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===========================================================
   Firebase
=========================================================== */

let firebaseStatus = "Not Initialized";

try {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });

    firebaseStatus = "Initialized";

    console.log("✅ Firebase Admin Initialized");
  } else {
    console.log("⚠ Firebase ENV variables missing.");
  }
} catch (err) {
  console.log("❌ Firebase Initialization Failed");
  console.log(err.message);
}

/* ===========================================================
   MongoDB
=========================================================== */

let mongoStatus = "Disconnected";

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    mongoStatus = "Connected";
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.log("❌ MongoDB Connection Failed");
    console.log(err.message);
  });

mongoose.connection.on("connected", () => {
  mongoStatus = "Connected";
});

mongoose.connection.on("disconnected", () => {
  mongoStatus = "Disconnected";
});

/* ===========================================================
   Socket.IO
=========================================================== */

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("🟢", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴", socket.id);
  });
});

/* ===========================================================
   Routes
=========================================================== */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BartaOne Backend Running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    server: "Running",
    mongodb: mongoStatus,
    firebase: firebaseStatus,
    node: process.version,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    timestamp: new Date(),
  });
});

/* ===========================================================
   404
=========================================================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

/* ===========================================================
   Error Handler
=========================================================== */

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message,
  });
});

/* ===========================================================
   Start Server
=========================================================== */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("------------------------------------");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`❤️ http://localhost:${PORT}/api/health`);
  console.log("------------------------------------");
});