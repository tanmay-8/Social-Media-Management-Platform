const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { postToInstagram, validateInstagramToken, getInstagramBusinessAccountId } = require('../utils/instagramAPI');
const { postToFacebook, validateFacebookToken, getUserPages, getPageAccessToken } = require('../utils/facebookAPI');

/**
 * @swagger
 * /api/social/connect/facebook:
 *   post:
 *     summary: Connect Facebook account and save access token
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pageId:
 *                 type: string
 *                 description: Facebook Page ID to post to
 *     responses:
 *       200:
 *         description: Facebook account connected successfully
 */
router.post('/connect/facebook', auth, async (req, res) => {
    try {
        const { pageId } = req.body;

        if (!pageId) {
            return res.status(400).json({ message: 'Page ID is required' });
        }

        // Get user's stored Facebook access token
        const userAccessToken = req.user.profile?.facebookAccessToken;
        if (!userAccessToken) {
            return res.status(400).json({ message: 'No Facebook account connected. Please connect your Facebook account first.' });
        }

        console.log('🔵 Connecting Facebook page:', pageId);
        console.log('User ID:', req.user._id);

        // Validate token is still valid
        const validation = await validateFacebookToken(userAccessToken);
        if (!validation.valid) {
            return res.status(401).json({ message: 'Facebook access token expired. Please reconnect your account.', error: validation.error });
        }

        // Get page access token using user's access token
        console.log('🔵 Getting page access token...');
        const pageTokenResult = await getPageAccessToken(userAccessToken, pageId);
        if (!pageTokenResult.success) {
            console.error('❌ Failed to get page access token:', pageTokenResult.error);
            return res.status(400).json({ message: 'Failed to connect page', error: pageTokenResult.error });
        }

        const pageAccessToken = pageTokenResult.pageAccessToken;
        console.log('✅ Got page access token');

        // Get page details to save the page name
        console.log('🔵 Fetching page details...');
        const pagesResult = await getUserPages(userAccessToken);
        const connectedPage = pagesResult.pages?.find(p => p.id === pageId);
        const pageName = connectedPage?.name || '';

        // Update user profile with page info
        console.log('🔵 Updating user profile...');
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    'profile.facebookPageId': pageId,
                    'profile.facebookPageName': pageName,
                    'profile.facebookPageAccessToken': pageAccessToken,
                    updatedAt: new Date()
                }
            },
            { new: true }
        ).select('-password');

        console.log('✅ Successfully connected page:', pageName);

        res.json({
            message: 'Facebook page connected successfully',
            user: {
                id: user._id,
                name: user.name,
                facebookPageId: pageId,
                facebookPageName: pageName
            }
        });

    } catch (error) {
        console.error('❌ Facebook page connection error:', error);
        res.status(500).json({ message: 'Failed to connect Facebook page', error: error.message });
    }
});

/**
 * @swagger
 * /api/social/connect/instagram:
 *   post:
 *     summary: Connect Instagram Business account and save access token
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Facebook access token (Instagram uses Facebook auth)
 *               facebookPageId:
 *                 type: string
 *                 description: Facebook Page ID connected to Instagram Business Account
 *     responses:
 *       200:
 *         description: Instagram account connected successfully
 */
router.post('/connect/instagram', auth, async (req, res) => {
    try {
        const { accessToken, facebookPageId } = req.body;

        if (!accessToken || !facebookPageId) {
            return res.status(400).json({ message: 'Access token and Facebook Page ID are required' });
        }

        // Validate token
        const validation = await validateInstagramToken(accessToken);
        if (!validation.valid) {
            return res.status(401).json({ message: 'Invalid access token', error: validation.error });
        }

        // Get Instagram Business Account ID from Facebook Page
        const igBusinessId = await getInstagramBusinessAccountId(accessToken, facebookPageId);
        
        if (!igBusinessId) {
            return res.status(400).json({ 
                message: 'No Instagram Business Account found for this Facebook Page',
                hint: 'Make sure your Facebook Page is connected to an Instagram Business Account'
            });
        }

        // Update user profile
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    'profile.instagramAccessToken': accessToken,
                    'profile.instagramBusinessId': igBusinessId,
                    'profile.facebookPageId': facebookPageId,
                    updatedAt: new Date()
                }
            },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Instagram account connected successfully',
            user: {
                id: user._id,
                instagramBusinessId: igBusinessId,
                username: validation.data.username
            }
        });

    } catch (error) {
        console.error('Instagram connection error:', error);
        res.status(500).json({ message: 'Failed to connect Instagram account', error: error.message });
    }
});

/**
 * @swagger
 * /api/social/pages:
 *   get:
 *     summary: Get user's Facebook pages
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Facebook pages
 */
router.get('/pages', auth, async (req, res) => {
    try {
        // Get access token from user's profile
        const accessToken = req.user.profile?.facebookAccessToken;

        if (!accessToken) {
            return res.status(400).json({ message: 'No Facebook account connected. Please connect your Facebook account first.' });
        }

        console.log('🔵 Fetching Facebook pages for user:', req.user._id);
        const result = await getUserPages(accessToken);

        if (!result.success) {
            console.error('❌ Failed to fetch pages:', result.error);
            return res.status(400).json({ message: 'Failed to fetch pages', error: result.error });
        }

        console.log('✅ Successfully fetched', result.pages.length, 'pages');
        res.json({
            message: 'Pages fetched successfully',
            pages: result.pages
        });

    } catch (error) {
        console.error('Fetch pages error:', error);
        res.status(500).json({ message: 'Failed to fetch pages', error: error.message });
    }
});

/**
 * @swagger
 * /api/social/post/test:
 *   post:
 *     summary: Test post to Instagram and/or Facebook (manual trigger)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: Public URL of image to post
 *               caption:
 *                 type: string
 *                 description: Post caption/message
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [instagram, facebook]
 *     responses:
 *       200:
 *         description: Posted successfully
 */
router.post('/post/test', auth, async (req, res) => {
    try {
        const { imageUrl, caption, platforms } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ message: 'Image URL is required' });
        }

        const user = await User.findById(req.user._id);
        const results = [];

        // Post to Instagram
        if (platforms.includes('instagram')) {
            if (!user.profile?.instagramAccessToken || !user.profile?.instagramBusinessId) {
                results.push({
                    platform: 'instagram',
                    success: false,
                    error: 'Instagram account not connected'
                });
            } else {
                const instagramResult = await postToInstagram(
                    user.profile.instagramAccessToken,
                    user.profile.instagramBusinessId,
                    imageUrl,
                    caption || ''
                );
                results.push(instagramResult);
            }
        }

        // Post to Facebook
        if (platforms.includes('facebook')) {
            if (!user.profile?.facebookPageAccessToken || !user.profile?.facebookPageId) {
                results.push({
                    platform: 'facebook',
                    success: false,
                    error: 'Facebook page not connected. Please connect a Facebook page first.'
                });
            } else {
                console.log('📘 Posting to Facebook page:', user.profile.facebookPageId);
                const facebookResult = await postToFacebook(
                    user.profile.facebookPageAccessToken,
                    user.profile.facebookPageId,
                    imageUrl,
                    caption || ''
                );
                results.push(facebookResult);
            }
        }

        // Check if any posts succeeded
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        res.json({
            message: `Posted to ${successCount} platform(s), ${failCount} failed`,
            results: results
        });

    } catch (error) {
        console.error('Test post error:', error);
        res.status(500).json({ message: 'Failed to post', error: error.message });
    }
});

/**
 * @swagger
 * /api/social/instagram/connect:
 *   post:
 *     summary: Connect Instagram Business Account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Instagram access token (from Facebook OAuth)
 *     responses:
 *       200:
 *         description: Instagram account connected
 */
router.post('/instagram/connect', auth, async (req, res) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ message: 'Access token is required' });
        }

        console.log('📸 Connecting Instagram account...');

        // Validate token and get Instagram Business Account ID
        const validation = await validateInstagramToken(accessToken);
        if (!validation.valid) {
            return res.status(401).json({ message: 'Invalid Instagram access token', error: validation.error });
        }

        // Get Instagram Business Account ID
        const igBusinessId = validation.data?.id;
        const username = validation.data?.username;

        if (!igBusinessId) {
            return res.status(400).json({ 
                message: 'Could not retrieve Instagram Business Account ID. Make sure you have a Business account.',
                hint: 'Convert your Instagram account to a Business account in settings.'
            });
        }

        // Check if Instagram account is already connected to another user
        const existingInstaUser = await User.findOne({ 
            'profile.instagramBusinessId': igBusinessId,
            _id: { $ne: req.user._id }
        });

        if (existingInstaUser) {
            console.error('❌ Instagram account already connected to another user');
            return res.status(400).json({ message: 'This Instagram account is already connected to another user' });
        }

        // Update user profile
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    'profile.instagramAccessToken': accessToken,
                    'profile.instagramBusinessId': igBusinessId,
                    'profile.instagramHandle': username,
                    updatedAt: new Date()
                }
            },
            { new: true }
        ).select('-password');

        console.log('✅ Instagram account connected successfully');

        res.json({
            message: 'Instagram account connected successfully',
            user: {
                id: user._id,
                instagramBusinessId: igBusinessId,
                instagramHandle: username
            }
        });

    } catch (error) {
        console.error('❌ Instagram connection error:', error);
        res.status(500).json({ message: 'Failed to connect Instagram account', error: error.message });
    }
});

/**
 * @swagger
 * /api/social/instagram/disconnect:
 *   post:
 *     summary: Disconnect Instagram Business Account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Instagram account disconnected
 */
router.post('/instagram/disconnect', auth, async (req, res) => {
    try {
        if (!req.user.profile?.instagramAccessToken) {
            return res.status(400).json({ message: 'No Instagram account connected' });
        }

        // Update user profile to remove Instagram data
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    'profile.instagramAccessToken': 1,
                    'profile.instagramBusinessId': 1,
                    'profile.instagramHandle': 1
                },
                $set: { updatedAt: new Date() }
            },
            { new: true }
        ).select('-password');

        console.log('✅ Instagram account disconnected');

        res.json({
            message: 'Instagram account disconnected successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('❌ Instagram disconnect error:', error);
        res.status(500).json({ message: 'Failed to disconnect Instagram account', error: error.message });
    }
});

module.exports = router;
