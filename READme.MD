# BartaOne 2.0 — Modern Content Creator Platform 🚀

BartaOne 2.0 is a full-stack mobile application that connects content creators (channel owners) and viewers through articles, videos, live streaming, and community features. It focuses on secure authentication, media management, multilingual support, and a streamlined publishing workflow.

## Key Highlights ✨
- **Dual roles:** Channel owners and viewers with role-based access
- **Content types:** Articles, videos, comments, likes and subscriptions
- **Live streaming:** Start/stop live broadcasts from the owner dashboard
- **Media:** Cloudinary-backed uploads and management
- **Internationalization:** Translation services for multilingual accessibility
- **Notifications:** Push and in-app notifications for engagement

## Tech Stack 🧰
- **Frontend:** React Native, Expo, React Navigation, Axios
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Auth & Infra:** Firebase Admin SDK, JWT
- **Media:** Cloudinary
- **Other services:** Translation API, Notification service

## Repository Structure — Detailed 📁
This repository contains two primary workspaces: `backend/` (API) and `frontend/` (Expo app). Below is a detailed breakdown of the most important files and folders to help you navigate the codebase.

backend/
- `server.js` — Express app entrypoint and main server bootstrap
- `package.json` — backend dependencies and npm scripts
- `config/`
  - `db.js` — MongoDB connection and Mongoose setup
  - `firebaseAdmin.js` — Firebase Admin SDK initialization
  - `cloudinary.js` — Cloudinary configuration
- `controllers/` — Express route handlers (per resource)
  - `authController.js`, `userController.js`, `channelController.js`, `articleController.js`, `videoController.js`, `liveController.js`, `translateController.js`
- `routes/` — Route definitions that wire controllers to endpoints
  - `authRoutes.js`, `userRoutes.js`, `channelRoutes.js`, `articleRoutes.js`, `videoRoutes.js`, `liveRoutes.js`, `translateRoutes.js`
- `models/` — Mongoose schemas and models
  - `User.js`, `Channel.js`, `Article.js`, `Video.js`, `Comment.js`, `Like.js`, `Live.js`, `Subscription.js`
- `middleware/` — Request middleware
  - `verifyFirebaseToken.js` — Firebase token verification
  - `uploadMiddleware.js` — file upload handling
  - `errorHandler.js` — centralized error responses
- `services/` — Integrations and business logic
  - `cloudinaryService.js`, `notificationService.js`, `translationService.js`
- `scripts/` — Utility scripts for maintenance
  - `cleanIndexes.js`, `cleanAllIndexes.js`, `cleanLikesIndexes.js`, `verifyIndexes.js`, `test-*.js`
- `logs/` — runtime logs (if used)

frontend/
- `app/` — Expo pages and navigation structure
  - `(auth)/` — auth screens: `ViewerLogin.jsx`, `ViewerSignup.jsx`, `OwnerLogin.jsx`, `OwnerSignup.jsx`, `ForgotPassword.jsx`, `VerifyEmail.jsx`, `SelectRole.jsx`, `Welcome.jsx`
  - `(owner)/` — owner screens: `Dashboard.jsx`, `CreateChannel.jsx`, `GoLive.jsx`, `UploadArticle.jsx`, `UploadVideo.jsx`, `ManagePosts.jsx`, `Profile.jsx`, `Subscribers.jsx`
  - `(viewer)/` — viewer screens: `Home.jsx`, `ChannelDetails.jsx`, `ArticleDetails.jsx`, `VideoPlayer.jsx` (and variants)
- `components/` — Reusable UI components
  - `Header.jsx`, `Footer.jsx`, `ChannelCard.jsx`, `VideoCard.jsx`, `NewsCard.jsx`, `LiveCard.jsx`, `SearchBar.jsx`, `Loader.jsx`, `EmptyState.jsx`, `AreaSelector.jsx`, `LanguageSelector.jsx`
- `context/` — React Context providers
  - `AuthContext.js`, `UserContext.js`, `ThemeContext.js`
- `hooks/` — Custom React hooks
  - `useAuth.js`, `useArticles.js`, `useChannels.js`, `useVideos.js`, `useTranslation.js`
- `services/` — Client-side API wrappers and Firebase client
  - `api.js`, `articleService.js`, `channelService.js`, `videoService.js`, `liveService.js`, `translateService.js`, `firebase.js`
- `utils/` — Helper utilities
  - `constants.js`, `helpers.js`, `validators.js`
- `assets/` — Images and static assets
- `app.json`, `babel.config.js`, `package.json` — Expo and project config

Other top-level files
- `READme.MD` — project overview (this file)
- `AGENTS.md`, `CLAUDE.md` — project notes and agent docs (if present)

This detailed structure should help you locate the main areas of work quickly.

## Quick Download
Clone the repository and enter the project directory:

```bash
git clone https://github.com/sag2004-hub/BartaOne-2.0.git
cd BartaOne-2.0
```

## Environment & Configuration 🔐

Before running the services, create environment configuration files for `backend` and (optionally) `frontend`. Below is a concise description of the environment values the project expects — the README no longer contains a copy/paste `.env` example; instead, just create a file and fill the following values.

Backend environment keys (description):
- `MONGO_URI` — MongoDB connection string
- `PORT` — port the backend server listens on
- `JWT_SECRET` — secret for signing JWTs
- `FIREBASE_PROJECT_ID` — Firebase project identifier
- `FIREBASE_CLIENT_EMAIL` — Firebase service account client email
- `FIREBASE_PRIVATE_KEY` — Firebase service account private key (keep secure)
- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- `CLOUDINARY_API_KEY` — Cloudinary API key
- `CLOUDINARY_API_SECRET` — Cloudinary API secret
- `TRANSLATION_API_URL` — optional external translation service URL
- `TRANSLATION_API_EMAIL` — optional translation service account email

Frontend environment notes:
- Add a public-facing API URL (e.g., `EXPO_PUBLIC_API_URL` or `REACT_NATIVE_API_URL`) that points to your backend API. Use `10.0.2.2` for Android emulators or `http://localhost:5000/api` for web development as appropriate.

Security note: never commit secrets to source control; use environment managers, CI secrets, or encrypted vaults for production deployments.

## Run Locally (Development) ▶️

Backend (API):

```bash
cd backend
npm install
# create .env from example
npm run dev
```

The backend default base URL is `http://localhost:5000/api` (verify `server.js` for exact port).

Frontend (Expo mobile app):

```bash
cd frontend
npm install
npm start
# or
npx expo start
```

Open the Expo dev tools then run on a simulator, emulator, or a physical device.

## Build & Production Notes 🏁
- Backend: use a process manager (PM2, Docker) and configure environment variables securely.
- Frontend: build native binaries with Expo Application Services (EAS) or Expo classic build workflows.

Example production backend run (PM2):

```bash
pm2 start backend/server.js --name bartaone-api --env production
```

## API & Health Checks ✅
- Health check endpoint: `GET /api/health` (returns simple status)
- Explore route files in `backend/routes/` for available endpoints and request shapes.

## Testing
- Unit and integration tests, if present, live under `backend/tests` or similar.
- Run tests with the scripts defined in each `package.json`, e.g.:

```bash
cd backend
npm test
```

## Contributing 🤝
- Fork the repository, create a branch for your feature or bugfix, and open a PR targeting `main`.
- Follow existing code style and run linters/tests before submitting.

Suggested branch workflow:

```
git checkout -b feat/your-feature
# implement changes
git commit -m "feat: short description"
git push origin feat/your-feature
```

## Troubleshooting & Tips 🛠️
- If you're using Android emulator, use `10.0.2.2` to reach `localhost` backend.
- If Firebase private key includes newlines, wrap it in quotes in `.env` or use a JSON credential file and load it in `config/firebaseAdmin.js`.

## License
This project is licensed under the ISC License. See the `LICENSE` file for details.

## Maintainers & Contact 📬
For questions or feature requests, open an issue on the repository or contact the maintainers via the project GitHub: https://github.com/sag2004-hub/BartaOne-2.0

---

If you'd like, I can also:
- add a `.env.example` file to the `backend` folder
- generate a short CONTRIBUTING.md
- open a PR with these changes

Tell me which of the above you'd like next.
