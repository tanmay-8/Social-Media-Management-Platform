# Production Deployment Guide

This guide explains how to deploy the full application in production:

- Frontend (Vite React app in client)
- Backend API (Node.js app in server) on Hostinger Cloud Startup
- MongoDB, Cloudinary, Razorpay, and Meta integrations

## 1. Architecture

Recommended production architecture for your setup:

- Frontend: Vercel (or Netlify)
- Backend: Hostinger Cloud Startup (Managed Node.js app)
- Database: MongoDB Atlas
- Media: Cloudinary

## 2. Prepare Production Services

Create and configure:

1. MongoDB Atlas cluster and user.
2. Cloudinary account and API credentials.
3. Razorpay live keys (if billing is enabled in production).
4. Meta developer app with Facebook Login + required permissions.

## 3. Backend Deployment on Hostinger Cloud Startup

This section is specifically for Hostinger Cloud Startup (not shared hosting).

## 3.1 Create Node.js app in Hostinger hPanel

1. Open hPanel.
2. Go to Websites -> Manage -> Advanced -> Node.js.
3. Create a new Node.js application.
4. Configure:
  - Node.js version: 18+ (20 recommended)
  - Application root: folder containing your project (for example: `public_html/Social-Media-Management`)
  - Startup file: `server/app.js`
  - Application URL/subdomain: your backend domain, for example `api.yourdomain.com`

Important:

- This is different from shared cPanel static hosting; Node.js app manager is required.
- Use a dedicated API subdomain (`api.`) for clean CORS and OAuth setup.

## 3.2 Upload code and install dependencies

Use Git (recommended) or Hostinger File Manager:

```bash
cd ~/public_html/Social-Media-Management
git pull
cd server
npm install
```

If you deploy from scratch:

```bash
git clone <your-repo-url>
cd Social-Media-Management/server
npm install
```

## 3.3 Configure environment variables in Hostinger

Add these in Node.js app environment variables (or `server/.env` if your plan supports it):

```env
PORT=3000
MONGODB_URI=<mongodb-atlas-uri>
JWT_SECRET=<strong-random-secret>
CORS_ALLOWED_ORIGIN=https://<your-frontend-domain>

SERVER_URL=https://<your-api-domain>
CLIENT_URL=https://<your-frontend-domain>

CLOUDINARY_CLOUD_NAME=<cloudinary-name>
CLOUDINARY_API_KEY=<cloudinary-key>
CLOUDINARY_API_SECRET=<cloudinary-secret>

RAZORPAY_KEY_ID=<razorpay-live-key-id>
RAZORPAY_KEY_SECRET=<razorpay-live-key-secret>

FACEBOOK_APP_ID=<facebook-app-id>
FACEBOOK_APP_SECRET=<facebook-app-secret>
META_APP_ID=<meta-app-id>
META_APP_SECRET=<meta-app-secret>
```

Important:

- `SERVER_URL` must be the public backend URL.
- Meta redirect URI must exactly match:
  `https://<your-api-domain>/api/auth/facebook/callback`
- `CORS_ALLOWED_ORIGIN` must exactly match your frontend origin.

## 3.4 Start or restart the Hostinger Node.js app

From hPanel Node.js:

- Click Restart after setting env variables or updating code.
- Check application logs in hPanel for startup issues.

If SSH PM2 is available in your plan, you can also run:

```bash
cd server
pm2 start app.js --name smm-server
pm2 save
```

## 3.5 Domain and SSL on Hostinger

- Point `api.yourdomain.com` DNS to your Hostinger cloud instance.
- Enable SSL in hPanel for the API domain.
- Ensure backend is reachable at `https://api.yourdomain.com/api/health`.

Note: On Hostinger Cloud Startup, you generally do not need manual Nginx/Certbot setup.

## 4. Frontend Deployment (Vercel)

## 4.1 Build settings

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`

## 4.2 Frontend environment variables

Set in Vercel project settings:

```env
VITE_API_URL=https://<your-api-domain>
```

Deploy and verify your frontend URL.

## 5. Meta and OAuth Production Configuration

In Meta app settings:

1. Add App Domains and Valid OAuth Redirect URIs.
2. Redirect URI should be:
   `https://<your-api-domain>/api/auth/facebook/callback`
3. Ensure app permissions are approved for production use.

Also verify backend values:

- `SERVER_URL=https://<your-api-domain>`
- `CLIENT_URL=https://<your-frontend-domain>`

## 6. Post-Deployment Verification Checklist

Run these checks:

1. `GET https://<your-api-domain>/api/health` returns OK.
2. `https://<your-api-domain>/api/docs` loads.
3. Frontend can sign up/login.
4. Profile/footer uploads work (Cloudinary).
5. Facebook OAuth flow redirects correctly.
6. User sees Posted Posts on home page.
7. Download image action works from posted history.
8. Schedulers run and create/process scheduled posts.

## 7. Update Flow (Hostinger)

For backend updates:

```bash
cd Social-Media-Management
git pull
cd server
npm install
```

Then restart the Node.js app from hPanel.

If using PM2:

```bash
pm2 restart smm-server
pm2 logs smm-server --lines 200
```

For frontend updates:

- Push to the connected branch in Vercel; Vercel rebuilds automatically.

## 8. Basic Security Hardening

1. Keep `.env` only on server; never commit it.
2. Use long random `JWT_SECRET`.
3. Restrict CORS to frontend domain only.
4. Enforce HTTPS for frontend and backend.
5. Rotate Cloudinary, Razorpay, and Meta secrets periodically.
6. Keep server packages updated.

## 9. Optional: Fully Managed Deploy Instead of VPS

If you do not want to maintain a VPS:

- Deploy backend to Render/Railway.
- Deploy frontend to Vercel.
- Keep MongoDB on Atlas and media on Cloudinary.

You still need the same environment variables and OAuth callback setup.

## 10. Hostinger Cloud Startup Quick Checklist

1. Node.js app created in hPanel and points to `server/app.js`.
2. Backend domain configured as `api.<yourdomain>` with SSL enabled.
3. Environment variables added (especially `SERVER_URL`, `CLIENT_URL`, `CORS_ALLOWED_ORIGIN`).
4. `npm install` completed in `server` directory.
5. App restarted from hPanel after every env or code change.
6. `https://api.<yourdomain>/api/health` returns OK.
