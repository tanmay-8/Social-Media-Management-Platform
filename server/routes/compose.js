const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const { uploadStream } = require('../utils/cloudinary');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Festival = require('../models/Festival');

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
        const { festivalId } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const festival = await Festival.findById(festivalId);
        if (!festival) return res.status(404).json({ message: 'Festival not found' });

        if (!user.profile?.footerImage?.url) return res.status(400).json({ message: 'User has no footer image' });
        if (!festival.baseImage?.url) return res.status(400).json({ message: 'Festival has no base image' });

        // fetch images as buffers
        const [baseResp, footerResp] = await Promise.all([
            axios.get(festival.baseImage.url, { responseType: 'arraybuffer' }),
            axios.get(user.profile.footerImage.url, { responseType: 'arraybuffer' })
        ]);

        const baseBuffer = Buffer.from(baseResp.data);
        const footerBuffer = Buffer.from(footerResp.data);

        // Normalize base to 1080x1080 and footer width to base width
        const baseSharp = sharp(baseBuffer).resize(1080, 1080, { fit: 'cover' }).png();
        const footerResized = await sharp(footerBuffer).resize({ width: 1080 }).png().toBuffer();

        const composedBuffer = await baseSharp
            .composite([{ input: footerResized, gravity: 'south' }])
            .toBuffer();

        // upload composed image to cloudinary via stream
        const stream = require('stream');
        const readStream = new stream.PassThrough();
        readStream.end(composedBuffer);

        const result = await uploadStream(readStream, { folder: 'composed' });

        res.json({ message: 'Composed uploaded', url: result.secure_url, public_id: result.public_id });
    } catch (err) {
        console.error('Compose error:', err.message || err);
        res.status(500).json({ message: 'Compose failed', error: err.message || err });
    }
});

module.exports = router;
