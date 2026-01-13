const express = require('express');
const auth = require('../middleware/auth');
const ScheduledPost = require('../models/ScheduledPost');
const Festival = require('../models/Festival');
const User = require('../models/User');
const { composeAndUpload } = require('../utils/composer');

const router = express.Router();

/**
 * @swagger
 * /api/scheduled:
 *   get:
 *     summary: List user's scheduled posts
 *     security:
 *       - bearerAuth: []
 */
router.get('/', auth, async (req, res) => {
    try {
        const posts = await ScheduledPost.find({ user: req.user._id }).populate('festival');
        res.json({ posts });
    } catch (err) {
        console.error('List scheduled error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @swagger
 * /api/scheduled:
 *   post:
 *     summary: Create a manual scheduled post (immediate or future)
 *     security:
 *       - bearerAuth: []
 */
router.post('/', auth, async (req, res) => {
    try {
        const { festivalId, scheduledAt } = req.body;
        const festival = await Festival.findById(festivalId);
        if (!festival) return res.status(404).json({ message: 'Festival not found' });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Require active subscription to schedule
        if (!user.subscription?.isActive) return res.status(403).json({ message: 'Subscription inactive' });

        const scheduled = new ScheduledPost({
            user: req.user._id,
            festival: festivalId,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
            status: 'pending',
            platforms: {
                facebook: { status: 'pending' },
                instagram: { status: 'pending' }
            }
        });
        await scheduled.save();

        res.status(201).json({ message: 'Scheduled', scheduled });
    } catch (err) {
        console.error('Create scheduled error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @swagger
 * /api/scheduled/{id}/process:
 *   post:
 *     summary: Process a scheduled post now (compose+upload)
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/process', auth, async (req, res) => {
    try {
        const scheduled = await ScheduledPost.findById(req.params.id).populate('festival');
        if (!scheduled) return res.status(404).json({ message: 'Scheduled post not found' });
        if (scheduled.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });

        const user = await User.findById(req.user._id);
        if (!user.profile?.footerImage?.url) return res.status(400).json({ message: 'No footer image found for user' });

        // compose and upload
        const result = await composeAndUpload(scheduled.festival.baseImage.url, user.profile.footerImage.url);

        scheduled.status = 'posted';
        scheduled.result = { composed: result };
        await scheduled.save();

        res.json({ message: 'Processed', result });
    } catch (err) {
        console.error('Process scheduled error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
