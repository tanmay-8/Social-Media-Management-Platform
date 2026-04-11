const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Festival = require('../models/Festival');
const { composeAndUpload } = require('../utils/composer');
const { postToFacebook } = require('../utils/facebookAPI');
const { resolveFestivalBaseImage } = require('../utils/festivalHelpers');

const router = express.Router();

/**
 * @swagger
 * /api/compose/test:
 *   post:
 *     summary: Compose festival base image with user's footer and upload to Cloudinary
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               festivalId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Composed image uploaded
 */
// POST /api/compose/test
// body: { festivalId }
// Protected: combines the festival base image with logged-in user's footer image and uploads to Cloudinary
router.post('/test', auth, async (req, res) => {
    try {
        const { festivalId, selectedBaseImageId } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const festival = await Festival.findById(festivalId);
        if (!festival) return res.status(404).json({ message: 'Festival not found' });

        if (!user.profile?.footerImage?.url) return res.status(400).json({ message: 'User has no footer image' });
        const resolvedImage = resolveFestivalBaseImage(festival, selectedBaseImageId);
        if (!resolvedImage.url) return res.status(400).json({ message: 'Festival has no base image' });

        const result = await composeAndUpload(
            resolvedImage.url,
            user.profile.footerImage.url
        );

        res.json({ message: 'Composed uploaded', url: result.secure_url, public_id: result.public_id });
    } catch (err) {
        console.error('Compose error:', err.message || err);
        res.status(500).json({ message: 'Compose failed', error: err.message || err });
    }
});

/**
 * @route   POST /api/compose/post-now
 * @desc    Immediately compose and post a festival to Facebook
 * @access  Private
 */
router.post('/post-now', auth, async (req, res) => {
    try {
        const { festivalId, selectedBaseImageId } = req.body;
        
        if (!festivalId) {
            return res.status(400).json({ message: 'Festival ID is required' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const festival = await Festival.findById(festivalId);
        if (!festival) {
            return res.status(404).json({ message: 'Festival not found' });
        }

        // Check if user has Facebook connected
        if (!user.profile?.facebookAccessToken) {
            return res.status(400).json({ message: 'Facebook account not connected' });
        }

        // Check if user has Facebook page connected
        if (!user.profile?.facebookPageId || !user.profile?.facebookPageAccessToken) {
            return res.status(400).json({ message: 'Facebook page not connected' });
        }

        // Check if user has footer image
        if (!user.profile?.footerImage?.url) {
            return res.status(400).json({ message: 'Footer image not set' });
        }

        const resolvedImage = resolveFestivalBaseImage(festival, selectedBaseImageId);

        // Check if festival has base image
        if (!resolvedImage.url) {
            return res.status(400).json({ message: 'Festival base image not available' });
        }

        console.log(`[POST NOW] Composing image for festival: ${festival.name}`);
        
        // Compose the image
        const composedResult = await composeAndUpload(
            resolvedImage.url,
            user.profile.footerImage.url
        );

        console.log(`[POST NOW] Image composed: ${composedResult.secure_url}`);

        const caption = `Happy ${festival.name}! 🎉\n\n${festival.description || 'Wishing you joy and prosperity!'}`;

        // Post to Facebook
        console.log(`[POST NOW] Posting to Facebook page: ${user.profile.facebookPageId}`);
        try {
            const fbResponse = await postToFacebook(
                user.profile.facebookPageAccessToken,
                user.profile.facebookPageId,
                composedResult.secure_url,
                caption
            );

            if (fbResponse.success) {
                console.log(`✅ [POST NOW] Successfully posted to Facebook:`, fbResponse);
                return res.json({
                    message: 'Posted successfully to Facebook',
                    festivalName: festival.name,
                    imageUrl: composedResult.secure_url,
                    results: {
                        facebook: {
                            success: true,
                            postId: fbResponse.postId
                        }
                    }
                });
            }

            console.error(`❌ [POST NOW] Facebook post failed:`, fbResponse.error);
            return res.status(500).json({
                message: 'Failed to post to Facebook',
                imageUrl: composedResult.secure_url,
                results: {
                    facebook: {
                        success: false,
                        error: fbResponse.error
                    }
                }
            });
        } catch (fbError) {
            console.error(`❌ [POST NOW] Facebook posting exception:`, fbError.message);
            return res.status(500).json({
                message: 'Failed to post to Facebook',
                error: fbError.message,
                results: {
                    facebook: {
                        success: false,
                        error: fbError.message
                    }
                }
            });
        }

    } catch (error) {
        console.error('[POST NOW] Error:', error);
        res.status(500).json({ 
            message: 'Failed to post festival',
            error: error.message || 'Unknown error'
        });
    }
});

module.exports = router;
