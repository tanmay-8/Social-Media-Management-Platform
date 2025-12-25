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
 *               accessToken:
 *                 type: string
 *                 description: Facebook access token from OAuth flow
 *               pageId:
 *                 type: string
 *                 description: Facebook Page ID to post to
 *     responses:
 *       200:
 *         description: Facebook account connected successfully
 */
router.post('/connect/facebook', auth, async (req, res) => {
    try {
        const { accessToken, pageId } = req.body;

        if (!accessToken) {
            return res.status(400).json({ message: 'Access token is required' });
        }

        // Validate token
        const validation = await validateFacebookToken(accessToken);
        if (!validation.valid) {
            return res.status(401).json({ message: 'Invalid Facebook access token', error: validation.error });
        }

        // Get page access token if pageId provided
        let pageAccessToken = accessToken;
        if (pageId) {
            const pageTokenResult = await getPageAccessToken(accessToken, pageId);
            if (pageTokenResult.success) {
                pageAccessToken = pageTokenResult.pageAccessToken;
            }
        }

        // Update user profile
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    'profile.facebookAccessToken': pageAccessToken,
                    'profile.facebookPageId': pageId || validation.data.id,
                    updatedAt: new Date()
                }
            },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Facebook account connected successfully',
            user: {
                id: user._id,
                name: validation.data.name,
                facebookPageId: pageId || validation.data.id
            }
        });

    } catch (error) {
        console.error('Facebook connection error:', error);
        res.status(500).json({ message: 'Failed to connect Facebook account', error: error.message });
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
 *     parameters:
 *       - in: query
 *         name: accessToken
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: List of Facebook pages
 */
router.get('/pages', auth, async (req, res) => {
    try {
        const { accessToken } = req.query;

        if (!accessToken) {
            return res.status(400).json({ message: 'Access token is required' });
        }

        const result = await getUserPages(accessToken);

        if (!result.success) {
            return res.status(400).json({ message: 'Failed to fetch pages', error: result.error });
        }

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
            if (!user.profile?.facebookAccessToken || !user.profile?.facebookPageId) {
                results.push({
                    platform: 'facebook',
                    success: false,
                    error: 'Facebook account not connected'
                });
            } else {
                const facebookResult = await postToFacebook(
                    user.profile.facebookAccessToken,
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

module.exports = router;
