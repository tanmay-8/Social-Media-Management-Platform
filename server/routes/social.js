const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
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
        const updateData = {
            'profile.facebookPageId': pageId,
            'profile.facebookPageName': pageName,
            'profile.facebookPageAccessToken': pageAccessToken,
            updatedAt: new Date()
        };

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
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
 * /api/social/pages/debug:
 *   get:
 *     summary: Debug Facebook pages API response
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Debug information
 */
router.get('/pages/debug', auth, async (req, res) => {
    try {
        const accessToken = req.user.profile?.facebookAccessToken;

        if (!accessToken) {
            return res.status(400).json({ message: 'No Facebook account connected' });
        }

        console.log('🔍 [DEBUG] Testing Facebook API...');
        
        // Test 1: Check token validity and permissions
        const axios = require('axios');
        const debugTokenResponse = await axios.get('https://graph.facebook.com/v21.0/debug_token', {
            params: {
                input_token: accessToken,
                access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
            }
        });
        
        console.log('🔍 [DEBUG] Token permissions:', debugTokenResponse.data.data.scopes);
        console.log('🔍 [DEBUG] Token valid:', debugTokenResponse.data.data.is_valid);
        console.log('🔍 [DEBUG] User ID:', debugTokenResponse.data.data.user_id);

        // Test 2: Get user info
        const userResponse = await axios.get('https://graph.facebook.com/v21.0/me', {
            params: {
                fields: 'id,name,email',
                access_token: accessToken
            }
        });
        console.log('🔍 [DEBUG] User info:', userResponse.data);

        // Test 3: Get accounts/pages with detailed error handling
        let pagesResult;
        try {
            pagesResult = await getUserPages(accessToken);
            console.log('🔍 [DEBUG] Pages result:', JSON.stringify(pagesResult, null, 2));
        } catch (pageError) {
            console.error('🔍 [DEBUG] Pages error:', pageError);
            pagesResult = { success: false, error: pageError.message };
        }

        // Test 4: Try alternative endpoints
        let accountsData = null;
        try {
            const accountsResponse = await axios.get('https://graph.facebook.com/v21.0/me/accounts', {
                params: {
                    access_token: accessToken
                }
            });
            accountsData = accountsResponse.data;
            console.log('🔍 [DEBUG] Raw /me/accounts response:', JSON.stringify(accountsData, null, 2));
        } catch (accountsError) {
            console.error('🔍 [DEBUG] Accounts error:', accountsError.response?.data || accountsError.message);
        }

        res.json({
            message: 'Debug information',
            tokenPermissions: debugTokenResponse.data.data.scopes,
            tokenValid: debugTokenResponse.data.data.is_valid,
            userId: debugTokenResponse.data.data.user_id,
            userInfo: userResponse.data,
            pagesResult: pagesResult,
            rawAccountsData: accountsData,
            troubleshooting: {
                zeroPages: 'If 0 pages returned, check these:',
                steps: [
                    '1. Are you an ADMIN or EDITOR of the Facebook page? (Not just a follower)',
                    '2. During Facebook login, did you select which pages to give access to?',
                    '3. Is the page a Business page (not a Personal profile)?',
                    '4. Go to facebook.com/settings?tab=business_tools and check app permissions',
                    '5. Try removing the app from Facebook settings and reconnecting'
                ],
                requiredRole: 'You must be at least an EDITOR on the Facebook page',
                checkPermissions: 'Visit: https://www.facebook.com/settings?tab=business_tools'
            }
        });
    } catch (error) {
        console.error('🔍 [DEBUG] Error:', error);
        res.status(500).json({ 
            message: 'Debug failed', 
            error: error.message,
            details: error.response?.data 
        });
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

        console.log('🔵 [/api/social/pages] Fetching Facebook pages for user:', req.user._id);
        console.log('🔵 [/api/social/pages] User has access token:', !!accessToken);
        
        const result = await getUserPages(accessToken);

        if (!result.success) {
            console.error('❌ [/api/social/pages] Failed to fetch pages:', result.error);
            return res.status(400).json({ message: 'Failed to fetch pages', error: result.error });
        }

        console.log('✅ [/api/social/pages] Successfully fetched', result.pages.length, 'pages');
        console.log('📤 [/api/social/pages] Sending pages to client:', JSON.stringify(result.pages.map(p => ({
            id: p.id,
            name: p.name
        })), null, 2));
        
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
 *     summary: Test post to Facebook (manual trigger)
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
 *     responses:
 *       200:
 *         description: Posted successfully
 */
router.post('/post/test', auth, async (req, res) => {
    try {
        const { imageUrl, caption } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ message: 'Image URL is required' });
        }

        const user = await User.findById(req.user._id);
        const results = [];

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

        // Check if any posts succeeded
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        res.json({
            message: `Facebook post ${successCount === 1 ? 'succeeded' : 'failed'}`,
            results: results
        });

    } catch (error) {
        console.error('Test post error:', error);
        res.status(500).json({ message: 'Failed to post', error: error.message });
    }
});

module.exports = router;
