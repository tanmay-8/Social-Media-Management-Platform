const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Generate JWT Token
const generateToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password,
            phone
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id, user.role);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                facebookId: user.facebookId,
                authProvider: user.authProvider,
                subscription: user.subscription
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id, user.role);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                facebookId: user.facebookId,
                authProvider: user.authProvider,
                profile: user.profile,
                subscription: user.subscription
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                role: req.user.role,
                facebookId: req.user.facebookId,
                authProvider: req.user.authProvider,
                profile: req.user.profile,
                subscription: req.user.subscription
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/auth/facebook
// @desc    Initiate Facebook OAuth login
// @access  Public (but can also be used by authenticated users to connect)
router.get('/facebook', auth.optional, (req, res) => {
    const redirectUri = `${process.env.SERVER_URL}/api/auth/facebook/callback`;
    
    console.log('🔵 Initiating Facebook & Instagram OAuth...');
    console.log('Redirect URI:', redirectUri);
    console.log('Facebook App ID:', process.env.FACEBOOK_APP_ID);
    
    // Use explicit scopes for Facebook Pages, Instagram, and user profile
    const scopes = [
        'email',
        'public_profile',
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'instagram_basic',
        'instagram_content_publish'
    ].join(',');
    
    // Include user ID in state if user is authenticated (connecting account)
    const stateData = {
        timestamp: Date.now(),
        userId: req.user?._id?.toString()
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    
    const fbAuthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`;
    
    res.redirect(fbAuthUrl);
});

// @route   GET /api/auth/facebook/callback
// @desc    Handle Facebook OAuth callback
// @access  Public
router.get('/facebook/callback', async (req, res) => {
    const { code, state } = req.query;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    try {
        console.log('🔵 Facebook callback received');
        console.log('Code present:', !!code);
        
        if (!code) {
            console.error('❌ No authorization code received');
            return res.redirect(`${clientUrl}/login?error=access_denied`);
        }

        // Decode state to check if this is a connection request from logged-in user
        let stateData = null;
        let connectingUserId = null;
        try {
            if (state) {
                stateData = JSON.parse(Buffer.from(state, 'base64').toString());
                connectingUserId = stateData.userId;
                console.log('🔵 Connecting user ID from state:', connectingUserId);
            }
        } catch (err) {
            console.log('⚠️ Could not parse state parameter');
        }

        // Exchange code for access token
        const redirectUri = `${process.env.SERVER_URL}/api/auth/facebook/callback`;
        console.log('🔵 Exchanging code for access token...');
        console.log('Using redirect URI:', redirectUri);
        
        const tokenResponse = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
            params: {
                client_id: process.env.FACEBOOK_APP_ID,
                client_secret: process.env.FACEBOOK_APP_SECRET,
                redirect_uri: redirectUri,
                code
            }
        });

        const { access_token } = tokenResponse.data;
        console.log('✅ Access token received:', access_token ? 'Yes' : 'No');

        // Store the access token in user profile for later use
        // Get user profile from Facebook
        console.log('🔵 Fetching user profile from Facebook...');
        const profileResponse = await axios.get('https://graph.facebook.com/v21.0/me', {
            params: {
                fields: 'id,name,email,picture',
                access_token
            }
        });

        const { id: facebookId, name, email, picture } = profileResponse.data;
        console.log('✅ User profile received:', { facebookId, name, email });

        // Try to get Instagram Business Account linked to user's Facebook Pages
        console.log('📸 Checking for Instagram Business Account...');
        let instagramBusinessId = null;
        let instagramHandle = null;
        try {
            const pagesResponse = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
                params: {
                    fields: 'id,name,instagram_business_account{id,username}',
                    access_token
                }
            });
            
            const pages = pagesResponse.data.data || [];
            const pageWithInstagram = pages.find(page => page.instagram_business_account);
            
            if (pageWithInstagram) {
                instagramBusinessId = pageWithInstagram.instagram_business_account.id;
                instagramHandle = pageWithInstagram.instagram_business_account.username;
                console.log('✅ Instagram Business Account found:', { instagramBusinessId, instagramHandle });
            } else {
                console.log('⚠️ No Instagram Business Account linked to Facebook Pages');
            }
        } catch (igError) {
            console.log('⚠️ Could not fetch Instagram Business Account:', igError.message);
        }

        let user;

        // If this is a connection request from a logged-in user, update that user
        if (connectingUserId) {
            console.log('🔵 This is a connection request from logged-in user');
            user = await User.findById(connectingUserId);
            
            if (user) {
                // Check if this Facebook account is already connected to another user
                const existingFbUser = await User.findOne({ 
                    facebookId, 
                    _id: { $ne: connectingUserId } 
                });
                
                if (existingFbUser) {
                    console.error('❌ Facebook account already connected to another user');
                    return res.redirect(`${clientUrl}/profile?error=facebook_already_connected`);
                }
                
                // Update the logged-in user with Facebook and Instagram info
                user.facebookId = facebookId;
                user.profile = user.profile || {};
                user.profile.facebookAccessToken = access_token;
                if (!user.profile.footerImage?.url && picture?.data?.url) {
                    user.profile.footerImage = { url: picture.data.url };
                }
                // Store Instagram data if available
                if (instagramBusinessId) {
                    user.profile.instagramBusinessId = instagramBusinessId;
                    user.profile.instagramHandle = instagramHandle;
                    user.profile.instagramAccessToken = access_token;
                }
                await user.save();
                console.log('✅ Updated existing user with Facebook & Instagram connection');
                
                // Redirect back to profile page
                const token = generateToken(user._id, user.role);
                return res.redirect(`${clientUrl}/profile?facebook_connected=true`);
            }
        }

        // Check if user exists by facebookId or email (for regular login)
        user = await User.findOne({ 
            $or: [{ facebookId }, { email: email }]
        });

        if (user) {
            // Update facebookId and access token if user exists via email but hasn't connected Facebook yet
            if (!user.facebookId && user.authProvider === 'local') {
                user.facebookId = facebookId;
                user.authProvider = 'facebook';
            }
            // Store/update the Facebook access token and Instagram data
            user.profile = user.profile || {};
            user.profile.facebookAccessToken = access_token;
            if (instagramBusinessId) {
                user.profile.instagramBusinessId = instagramBusinessId;
                user.profile.instagramHandle = instagramHandle;
                user.profile.instagramAccessToken = access_token;
            }
            await user.save();
        } else {
            // Create new user with Facebook and Instagram access tokens
            user = new User({
                name,
                email: email || `${facebookId}@facebook.com`, // Fallback email
                facebookId,
                authProvider: 'facebook',
                profile: {
                    facebookAccessToken: access_token,
                    instagramBusinessId: instagramBusinessId,
                    instagramHandle: instagramHandle,
                    instagramAccessToken: instagramBusinessId ? access_token : undefined,
                    footerImage: {
                        url: picture?.data?.url
                    }
                }
            });
            await user.save();
        }

        // Generate JWT token
        const token = generateToken(user._id, user.role);

        // Redirect to client with token
        res.redirect(`${clientUrl}/auth/callback?token=${token}`);
    } catch (error) {
        console.error('Facebook OAuth error:', error.response?.data || error.message);
        console.error('Full error:', error);
        
        // Provide more specific error messages
        const errorMessage = error.response?.data?.error?.message || error.message || 'auth_failed';
        res.redirect(`${clientUrl}/login?error=${encodeURIComponent(errorMessage)}`);
    }
});

// @route   POST /api/auth/facebook/connect
// @desc    Connect Facebook account to existing user
// @access  Private
router.post('/facebook/connect', auth, async (req, res) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ message: 'Access token is required' });
        }

        // Verify token and get Facebook user info
        const profileResponse = await axios.get('https://graph.facebook.com/v21.0/me', {
            params: {
                fields: 'id,name,email',
                access_token: accessToken
            }
        });

        const { id: facebookId } = profileResponse.data;

        // Check if Facebook account is already connected to another user
        const existingUser = await User.findOne({ facebookId, _id: { $ne: req.user._id } });
        if (existingUser) {
            return res.status(400).json({ message: 'This Facebook account is already connected to another user' });
        }

        // Update current user
        req.user.facebookId = facebookId;
        await req.user.save();

        res.json({
            message: 'Facebook account connected successfully',
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                facebookId: req.user.facebookId,
                profile: req.user.profile
            }
        });
    } catch (error) {
        console.error('Facebook connect error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to connect Facebook account' });
    }
});

// @route   POST /api/auth/facebook/disconnect
// @desc    Disconnect Facebook and Instagram accounts from user
// @access  Private
router.post('/facebook/disconnect', auth, async (req, res) => {
    try {
        if (!req.user.facebookId) {
            return res.status(400).json({ message: 'No Facebook account connected' });
        }

        // Don't allow disconnecting if user has no password (OAuth-only user)
        if (req.user.authProvider === 'facebook' && !req.user.password) {
            return res.status(400).json({ 
                message: 'Cannot disconnect Facebook. Please set a password first to maintain account access.' 
            });
        }

        // Disconnect both Facebook and Instagram
        req.user.facebookId = undefined;
        if (req.user.profile) {
            req.user.profile.facebookAccessToken = undefined;
            req.user.profile.instagramBusinessId = undefined;
            req.user.profile.instagramHandle = undefined;
            req.user.profile.instagramAccessToken = undefined;
        }
        await req.user.save();

        res.json({
            message: 'Facebook and Instagram accounts disconnected successfully',
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                profile: req.user.profile
            }
        });
    } catch (error) {
        console.error('Facebook disconnect error:', error);
        res.status(500).json({ message: 'Failed to disconnect Facebook account' });
    }
});

// Keep Instagram disconnect for backward compatibility
// @route   POST /api/auth/instagram/disconnect
// @desc    Disconnect Instagram account from user
// @access  Private
router.post('/instagram/disconnect', auth, async (req, res) => {
    try {
        if (!req.user.profile?.instagramAccessToken) {
            return res.status(400).json({ message: 'No Instagram account connected' });
        }

        req.user.profile.instagramAccessToken = undefined;
        req.user.profile.instagramHandle = undefined;
        req.user.profile.instagramBusinessId = undefined;
        await req.user.save();

        res.json({
            message: 'Instagram account disconnected successfully',
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                profile: req.user.profile
            }
        });
    } catch (error) {
        console.error('❌ Instagram disconnect error:', error);
        res.status(500).json({ message: 'Failed to disconnect Instagram account' });
    }
});

module.exports = router;

