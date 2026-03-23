# Social Media Management Platform - Backend

Express + MongoDB API for festival automation, profile management, subscription handling, image composition, and social posting.

## What This Backend Does

- Email/password and Facebook OAuth authentication
- User profile management including address and social handles
- Profile/footer image uploads to Cloudinary
- Festival management and filtering
- Subscription workflow (Razorpay)
- Scheduled posting pipeline
- Compose festival + footer images for publishing
- Admin APIs for users, festivals, and assets
- User-facing posted-history endpoint for downloaded published images

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Cloudinary image storage
- Sharp image composition
- Razorpay payments
- Swagger API docs
- node-cron schedulers

## Directory Overview

```
server/
  app.js
  package.json
  middleware/
  models/
  routes/
  scripts/
  utils/
```

## Run Locally

1. Install dependencies:

```bash
cd server
npm install
```

2. Create `.env` with required values (see [SETUP.md](SETUP.md)).

3. Start server:

```bash
npm run dev
```

4. Verify:

- `GET /api/health`
- Swagger: `/api/docs`

## Main Routes

- `/api/auth` authentication and Facebook OAuth
- `/api/users` user profile and image uploads
- `/api/subscriptions` Razorpay billing/subscription state
- `/api/festivals` user-facing festivals
- `/api/scheduled` scheduling and posted history
- `/api/social` Facebook page integration and manual test post
- `/api/compose` composition test utilities
- `/api/admin` admin-only operations

## Posted History for Users

The backend exposes:

- `GET /api/scheduled/posted`

This endpoint returns only the logged-in user's successfully posted items with normalized `imageUrl`, `postedAt`, festival details, and platform status so the frontend can show downloadable posted images.

## Schedulers

On startup, the backend automatically starts:

- Auto-post scheduler (`utils/autoPostScheduler.js`)
- Festival auto-scheduler (`utils/autoScheduleFestivals.js`)

## Environment Variables (Summary)

- Core: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CORS_ALLOWED_ORIGIN`
- OAuth URLs: `SERVER_URL`, `CLIENT_URL`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- Meta/Facebook: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `META_APP_ID`, `META_APP_SECRET`

Refer to [SETUP.md](SETUP.md) for exact setup steps.

## Scripts

- `npm start` run production server
- `npm run dev` run with nodemon
- `npm run import-festivals` import festivals JSON

## Production Deployment

Use the root deployment guide: [../deploy.md](../deploy.md)
