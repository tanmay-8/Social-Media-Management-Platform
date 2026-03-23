# Server Setup Guide

This document explains how to run the backend API in local development.

## 1. Prerequisites

- Node.js 18+
- npm 9+
- MongoDB (local or Atlas)
- Cloudinary account (required for image upload/composition)

Optional for full features:

- Razorpay account (subscriptions)
- Meta app credentials (Facebook/Instagram integrations)

## 2. Install Dependencies

Run from the server directory:

```bash
cd server
npm install
```

## 3. Configure Environment Variables

Create server/.env:

```env
# Core
PORT=3000
MONGODB_URI=mongodb://localhost:27017/social-media-platform
JWT_SECRET=replace-with-a-long-random-secret
CORS_ALLOWED_ORIGIN=http://localhost:5173

# OAuth URLs
SERVER_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173

# Razorpay (optional unless testing subscriptions)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Cloudinary (required for profile/footer uploads and composed images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Meta/Facebook/Instagram (optional unless testing social posting)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
```

Notes:

- `JWT_SECRET` should be at least 32 characters.
- `SERVER_URL` and `CLIENT_URL` are required for Facebook OAuth callback flow.
- If Meta or Cloudinary vars are missing, server starts but related routes fail or are skipped.

## 4. Run the API

```bash
npm run dev
```

Production mode locally:

```bash
npm start
```

## 5. Verify the Server

- Health check: `GET http://localhost:3000/api/health`
- API docs: `http://localhost:3000/api/docs`

## 6. Useful Scripts

Run from server directory:

- `npm run import-festivals` imports festivals from `scripts/festivals.json`
- `node scripts/createAdmin.js` creates an admin user
- `node scripts/deleteFestivals.js` deletes festival data

## 7. What Runs Automatically

When the server starts:

- Auto-post scheduler starts (`utils/autoPostScheduler.js`)
- Festival auto-scheduler starts (`utils/autoScheduleFestivals.js`)

## 8. Troubleshooting

### MongoDB connection error

- Confirm `MONGODB_URI` is correct.
- For Atlas, check IP allowlist and credentials.

### 401 Unauthorized on protected routes

- Ensure JWT token is sent as `Authorization: Bearer <token>`.
- Confirm `JWT_SECRET` matches the one used when issuing the token.

### Facebook OAuth redirect mismatch

- Confirm Meta app redirect URI exactly matches:
   `SERVER_URL/api/auth/facebook/callback`
- Confirm `SERVER_URL` and `CLIENT_URL` values are correct.

### Image upload/compose failures

- Verify Cloudinary variables.
- Check server logs for Cloudinary upload errors.

## 9. Next Docs

For production deployment instructions, use the root deploy.md file.




