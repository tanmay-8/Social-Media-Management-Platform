# Social Media Management Platform

A full-stack social media management platform that combines images, manages user subscriptions, and automates festival-based post scheduling for Instagram and Facebook.

## Features

### Current Features
1. **User Authentication** - Sign up, login, and secure session management
2. **User Profiles** - Manage personal information and social media accounts
3. **Subscription Management** - Razorpay integration for 3, 6, and 12-month plans
4. **Festival Categories** - Filter festivals by category (All, Hindu, Muslim)
5. **Image Combiner** - Combine main images with footer images for social media posts
6. **Festival Calendar** - View upcoming festivals based on user preferences

### Upcoming Features
- Automated post scheduling to Instagram and Facebook
- Integration with Meta Business Suite API
- Automated image generation for festival posts

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Razorpay** for payment processing
- **Express Validator** for input validation

### Frontend
- **HTML5** / **CSS3** / **JavaScript**
- **Razorpay Checkout** for payments
- **JSZip** for batch downloads

## Project Structure

```
Social-Media-Management-Platform
├── server.js              # Express server entry point
├── package.json           # Node.js dependencies
├── .env.example           # Environment variables template
├── models/
│   └── User.js           # User model with subscription schema
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User profile routes
│   ├── subscriptions.js  # Subscription & payment routes
│   └── festivals.js      # Festival data routes
├── middleware/
│   └── auth.js           # JWT authentication middleware
└── public/
    ├── index.html        # Image combiner page
    ├── login.html        # Login page
    ├── signup.html       # Signup page
    ├── dashboard.html    # User dashboard
    ├── profile.html      # Profile management
    ├── styles.css        # Image combiner styles
    ├── auth-styles.css   # Auth pages styles
    ├── dashboard-styles.css # Dashboard styles
    ├── script.js         # Image combiner logic
    ├── auth.js           # Authentication logic
    ├── dashboard.js      # Dashboard logic
    └── profile.js         # Profile management logic
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Razorpay account (for payment processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Social-Media-Management-Platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/social-media-platform
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret
   ```

4. **Set up MongoDB**
   - Option 1: Local MongoDB
     - Install MongoDB locally
     - Start MongoDB service
   - Option 2: MongoDB Atlas
     - Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
     - Create cluster and get connection string
     - Update `MONGODB_URI` in `.env`

5. **Set up Razorpay**
   - Create account at [Razorpay](https://razorpay.com/)
   - Get your Key ID and Key Secret from dashboard
   - Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`

6. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Open browser and navigate to `http://localhost:3000`
   - Sign up for a new account or login

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### User Profile
- `GET /api/users/profile` - Get user profile (Protected)
- `PUT /api/users/profile` - Update user profile (Protected)

### Subscriptions
- `POST /api/subscriptions/create-order` - Create Razorpay order (Protected)
- `POST /api/subscriptions/verify-payment` - Verify payment and activate subscription (Protected)
- `GET /api/subscriptions/status` - Get subscription status (Protected)

### Festivals
- `GET /api/festivals` - Get festivals based on user category (Protected)

## Subscription Plans

- **3 Months**: ₹999
- **6 Months**: ₹1,799
- **12 Months**: ₹2,999

## Festival Categories

Users can select from:
- **All Festivals** - All festivals from the calendar
- **Hindu Festivals** - Only Hindu festivals
- **Muslim Festivals** - Only Muslim festivals

## Usage

1. **Sign Up**: Create a new account with email and password
2. **Complete Profile**: Add Instagram handle, Facebook Page ID, and select festival category
3. **Subscribe**: Choose a subscription plan and complete payment via Razorpay
4. **Combine Images**: Use the Image Combiner tool to create social media posts
5. **View Festivals**: Check upcoming festivals based on your category preference

## Development

### Adding New Features
- Backend routes: Add to `routes/` directory
- Frontend pages: Add HTML files to `public/` directory
- Models: Add to `models/` directory

### Testing
- Test authentication flows
- Test payment integration (use Razorpay test keys)
- Test festival filtering logic

## Security Notes

- Never commit `.env` file to version control
- Use strong JWT_SECRET in production
- Validate all user inputs
- Use HTTPS in production
- Implement rate limiting for API endpoints

## License

This project is open-source and available under the MIT License.

## Support

For issues or questions, please open an issue in the repository.
