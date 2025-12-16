# Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Configure Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/social-media-platform
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

### Getting Razorpay Credentials:
1. Sign up at https://razorpay.com/
2. Go to Settings → API Keys
3. Generate test keys (for development) or live keys (for production)
4. Copy Key ID and Key Secret to `.env`

## Step 3: Start MongoDB
- **Local MongoDB**: Make sure MongoDB is running on your system
- **MongoDB Atlas**: Use the connection string from your Atlas cluster

## Step 4: Run the Application
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## Step 5: Access the Application
Open your browser and go to: `http://localhost:3000`

## Testing the Application

1. **Sign Up**: Go to `/signup` and create an account
2. **Login**: Use your credentials to login
3. **Complete Profile**: 
   - Add Instagram handle (optional)
   - Add Facebook Page ID (optional)
   - Select festival category
4. **Subscribe**: Choose a plan and test payment (use Razorpay test mode)
5. **Use Image Combiner**: Go to home page and combine images

## Troubleshooting

### MongoDB Connection Error
- Check if MongoDB is running: `mongod --version`
- Verify connection string in `.env`
- For Atlas: Check IP whitelist and credentials

### Razorpay Payment Not Working
- Verify Key ID and Key Secret in `.env`
- Check Razorpay dashboard for active keys
- Use test mode keys for development

### Port Already in Use
- Change `PORT` in `.env` to another port (e.g., 3001)
- Or stop the process using port 3000

## Next Steps

After setup, you can:
- Customize subscription prices in `routes/subscriptions.js`
- Add more festival categories
- Integrate Instagram/Facebook APIs for auto-posting
- Add more features to the dashboard




