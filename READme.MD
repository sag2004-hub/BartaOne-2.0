# BartaOne 2.0 🚀

BartaOne 2.0 is a modern full-stack content platform built for creators and viewers. It empowers channel owners to publish articles, videos, and newspaper-style content, while viewers can discover content, subscribe to channels, and engage with the community.

This project combines a polished React Native and Expo frontend with a scalable Node.js and Express backend, supported by MongoDB, Firebase, Cloudinary, and translation services.

## 🌟 Overview

BartaOne 2.0 is designed around three core experiences:
- Creator publishing workflows for articles, videos, and newspapers
- Viewer discovery and engagement through subscriptions and content browsing
- Secure authentication and role-based access for owners and viewers

## ✨ Key Features

### For Channel Owners 👑
- Create and manage channels
- Publish articles and videos
- Create and manage newspaper-style content
- Upload media through Cloudinary-backed pipelines
- Access role-based owner dashboards

### For Viewers 👀
- Browse channels and content
- View articles and videos
- Subscribe to creators
- Interact with published content

### Platform Capabilities ⚙️
- Firebase-based authentication and authorization
- MongoDB persistence with Mongoose models
- Translation support for multilingual content access
- Upload and media management services
- Clean API structure with dedicated route and controller layers

## 🛠️ Tech Stack

### Frontend
- React Native
- Expo
- Expo Router
- React Query
- Axios
- Firebase client SDK

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Firebase Admin SDK
- Cloudinary
- JWT authentication
- Translation and notification services

## 📁 Project Structure

```text
backend/
  config/         # Database, Firebase, and Cloudinary setup
  controllers/    # Request handlers for each feature area
  middleware/     # Auth, upload, and error middleware
  models/         # Mongoose schemas and models
  routes/         # API endpoints
  services/       # Business logic and external integrations
  server.js       # Application entry point

frontend/
  app/            # Screens and navigation structure
  components/     # Reusable UI components
  context/        # Auth and app state providers
  hooks/          # Custom hooks for data access
  services/       # API and Firebase integration helpers
  utils/          # Shared helpers and validators
```

## 🆕 Recent Improvements

This version includes several important updates:
- Newspaper-style content support through the backend and frontend
- Cloudinary-based upload handling for media files
- Translation integration for multilingual workflows
- Cleaner backend routing with dedicated upload and newspaper APIs
- Improved project organization for easier maintenance and onboarding

## ✅ Prerequisites

Before you start, make sure you have:
- Node.js installed
- npm or yarn available
- MongoDB running or reachable
- Firebase project credentials
- Cloudinary account credentials

## ▶️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sag2004-hub/BartaOne-2.0.git
cd BartaOne-2.0
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a .env file inside the backend folder and add the required values:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Optional values may include translation service settings if you plan to use that integration.

### 4. Start the backend

```bash
npm run dev
```

The API will be available at:
- http://localhost:5000/api
- Health check: http://localhost:5000/api/health

### 5. Start the frontend

Open a new terminal and run:

```bash
cd frontend
npm install
npm start
```

You can then run the app in an emulator, simulator, or browser depending on your setup.

## 🌐 Environment Notes

- For Android emulators, use 10.0.2.2 when pointing to the local backend.
- For local web development, http://localhost:5000/api is usually the correct base URL.
- Keep all secrets out of version control and use environment variables in development and production.

## 📡 API Highlights

The backend exposes routes for:
- Authentication and user management
- Channel management
- Articles and videos
- Newspapers
- Translation services
- File uploads

## 🧪 Development Notes

To run the backend in development mode:

```bash
cd backend
npm run dev
```

To start the Expo app:

```bash
cd frontend
npm start
```

## 🤝 Contributing

Contributions are welcome. If you plan to make changes:
1. Create a feature branch
2. Make your updates
3. Test your changes locally
4. Open a pull request with a clear summary

Example:

```bash
git checkout -b feat/your-feature
```

## 📄 License

This project is licensed under the ISC License.

## 📬 Contact

For questions, issues, or feature requests, please open an issue in the repository or contact the project maintainers through GitHub.
