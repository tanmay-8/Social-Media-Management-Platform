const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');

// Load .env from parent directory (server folder)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');
    
    const email = process.argv[2];
    
    if (!email) {
      console.log('❌ Please provide an email address');
      console.log('Usage: node createAdmin.js your-email@example.com');
      process.exit(1);
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email "${email}" not found`);
      console.log('Please sign up through the app first, then run this script.');
      process.exit(1);
    }
    
    if (user.role === 'admin') {
      console.log(`✓ User ${email} is already an admin!`);
      process.exit(0);
    }
    
    user.role = 'admin';
    await user.save();
    
    console.log(`✓ Success! User ${email} is now an admin!`);
    console.log('⚠️  Important: User must logout and login again to access admin panel.');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
