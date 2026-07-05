# BartaOne 2.0 🚀

BartaOne 2.0 is a modern full-stack mobile application designed for content creators and viewers to connect through news articles, videos, live streaming, and community engagement. The platform supports two user roles: channel owners and viewers, enabling creators to publish content and audiences to explore, subscribe, and interact. ✨

## Overview 🌐

BartaOne brings together:
- 📺 Channel creation and management
- 📝 Article publishing and video uploads
- 🎥 Live streaming capabilities
- 👥 Viewer subscriptions and content discovery
- 🌍 Translation support for multilingual content
- 🔐 Secure authentication and role-based access

## Key Features ⭐

### For Channel Owners 👑
- 🛠️ Create and manage a channel
- 📤 Upload articles and videos
- 📡 Start and end live broadcasts
- 📊 View subscriber activity and channel insights
- 🧾 Manage published content from a dedicated dashboard

### For Viewers 👀
- 🔎 Browse channels, articles, videos, and live streams
- ❤️ Subscribe to favorite creators
- ▶️ Watch content and follow live broadcasts
- 🌐 Access translated content for better accessibility

## Tech Stack 🧰

### Frontend 📱
- React Native
- Expo
- React Navigation
- Axios
- Firebase Authentication
- Expo-based mobile UI components

### Backend ⚙️
- Node.js
- Express.js
- MongoDB with Mongoose
- Firebase Admin SDK
- Cloudinary for media storage
- JWT-based authentication
- Translation and notification services

## Project Structure 🗂️

- backend/ - REST API, database models, authentication, and media services
- frontend/ - Expo mobile application UI and client-side services
- configuration files - environment setup and app configuration

## Prerequisites ✅

Before running this project, ensure you have the following installed:
- Node.js (v18 or later)
- npm or yarn
- MongoDB
- Firebase project credentials
- Cloudinary account credentials

## Backend Setup 🛠️

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and configure the required variables, including:
   - `MONGO_URI`
   - `PORT`
   - `JWT_SECRET`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `TRANSLATION_API_URL` (optional)
   - `TRANSLATION_API_EMAIL` (optional)
4. Start the backend server:
   ```bash
   npm run dev
   ```

The API will be available at:
- `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

## Frontend Setup 📲

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create the frontend environment configuration for Expo, including the API base URL.
4. Start the app:
   ```bash
   npm start
   ```

You can then run the app on Android, iOS, or a web simulator depending on your development environment.

## Usage 🚀

- Register as a channel owner or viewer
- Create a channel if you are an owner
- Publish content, go live, or subscribe to creators
- Explore the dashboard for managing and monitoring content

## License 📄

This project is licensed under the ISC License.

## Contact 🤝

For questions or support, please contact the project maintainers through the repository or development team.
