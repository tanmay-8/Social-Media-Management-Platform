const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: function() {
            // Password not required for OAuth users
            return !this.facebookId;
        },
        minlength: [6, 'Password must be at least 6 characters']
    },
    phone: {
        type: String,
        trim: true
    },
    // OAuth fields
    facebookId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    authProvider: {
        type: String,
        enum: ['local', 'facebook'],
        default: 'local'
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    profile: {
        instagramHandle: String,
        facebookPageId: String,
        facebookPageName: String,
        instagramBusinessId: String,
        // Cloudinary image for user's footer/branding
        footerImage: {
            url: String,
            public_id: String
        },
        // Stored tokens for social posting (consider encrypting these in production)
        facebookAccessToken: String,
        facebookPageAccessToken: String,
        instagramAccessToken: String,
        festivalCategory: {
            type: String,
            enum: ['all', 'hindu', 'muslim'],
            default: 'all'
        }
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', '3months', '6months', '12months'],
            default: 'free'
        },
        startDate: Date,
        endDate: Date,
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String,
        isActive: {
            type: Boolean,
            default: false
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    // Skip password hashing for OAuth users or if password not modified
    if (!this.password || !this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    // If no password set (OAuth user), return false
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);




