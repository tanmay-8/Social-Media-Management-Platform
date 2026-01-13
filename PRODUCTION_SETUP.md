# 🚀 Production Deployment Setup

## ✅ Critical Security Fixes Applied

### 1. Environment-Based API URLs
- **Frontend**: Now uses `VITE_API_URL` environment variable
- **Location**: `client/.env`
- **Production**: Set `VITE_API_URL=https://your-api-domain.com`

### 2. CORS Restriction
- **Backend**: Now restricted to specific origin
- **Location**: `server/app.js`
- **Production**: Set `CORS_ALLOWED_ORIGIN=https://your-frontend-domain.com` in server `.env`

### 3. Secure JWT Secret
- **Generated**: 128-character random hex string
- **Your Secret**: `6ac7d18136ae637a333196c5c42d78d0d11c7ffed0f8c7480bcbbcf65f8a42e1fb472b9ffeb45466dbb4e88ba61b29c82ad1d2c5cf97db3c8e12f86254c0f6b7`
- **Action Required**: Copy this to your production `JWT_SECRET` in server `.env`

### 4. Global Error Handler
- **Added**: Catches all unhandled errors
- **Features**: 
  - Prevents error details from leaking in production
  - Returns clean error responses
  - Logs errors for debugging
  - Handles 404 routes

### 5. Request Size Limits
- **Added**: 10MB limit on JSON/URL-encoded requests
- **Prevents**: DOS attacks with huge payloads

---

## 📋 Production Deployment Checklist

### Server Environment Variables (`.env`)
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://your-atlas-uri
JWT_SECRET=6ac7d18136ae637a333196c5c42d78d0d11c7ffed0f8c7480bcbbcf65f8a42e1fb472b9ffeb45466dbb4e88ba61b29c82ad1d2c5cf97db3c8e12f86254c0f6b7
CORS_ALLOWED_ORIGIN=https://your-frontend-domain.com
SERVER_URL=https://your-api-domain.com
CLIENT_URL=https://your-frontend-domain.com

# Facebook OAuth
FACEBOOK_APP_ID=your_production_facebook_app_id
FACEBOOK_APP_SECRET=your_production_facebook_app_secret
FACEBOOK_CONFIG_ID=your_production_facebook_config_id

# Razorpay
RAZORPAY_KEY_ID=your_production_razorpay_key
RAZORPAY_KEY_SECRET=your_production_razorpay_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Client Environment Variables (`.env`)
```bash
VITE_API_URL=https://your-api-domain.com
```

### Build Commands
```bash
# Build frontend
cd client
npm install
npm run build

# The dist/ folder will contain production files

# Server (no build needed for Node.js)
cd ../server
npm install --production
```

### Deployment Steps

1. **Set Environment Variables** in your hosting platform (Heroku, Railway, Render, etc.)

2. **Update Facebook OAuth URLs**:
   - Go to Facebook Developer Console
   - Add production domains to OAuth redirect URIs
   - Add production CLIENT_URL to Valid OAuth Redirect URIs

3. **Deploy Backend**:
   ```bash
   # Start with PM2 or your hosting platform's process manager
   pm2 start app.js --name socimanage-api
   ```

4. **Deploy Frontend**:
   - Upload `client/dist/` to static hosting (Vercel, Netlify, Cloudflare Pages)
   - Or serve via Express static middleware

5. **Test Critical Flows**:
   - ✅ User signup/login
   - ✅ Facebook/Instagram OAuth
   - ✅ Razorpay payment
   - ✅ Image upload
   - ✅ Post scheduling

---

## 🔒 Security Notes

- ✅ CORS restricted to your domain
- ✅ Request size limits (10MB)
- ✅ Global error handler (no leak in production)
- ✅ JWT secret is cryptographically secure
- ✅ Environment-based configuration

### Still Recommended (but not critical):
- Add `helmet` for security headers
- Add rate limiting on auth/payment endpoints
- Enable HTTPS (via reverse proxy like Nginx)
- Set up monitoring (Sentry, LogRocket)
- Configure database backups

---

## 🆘 Troubleshooting

**CORS Error**: Check `CORS_ALLOWED_ORIGIN` matches your frontend domain exactly (no trailing slash)

**API 404**: Verify `VITE_API_URL` is set correctly in client `.env`

**JWT Invalid**: Make sure `JWT_SECRET` is the same in production `.env`

**Facebook OAuth Fails**: Add production URLs to Facebook App settings
