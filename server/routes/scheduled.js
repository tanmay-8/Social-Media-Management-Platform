const express = require('express');
const auth = require('../middleware/auth');
const ScheduledPost = require('../models/ScheduledPost');
const Festival = require('../models/Festival');
const User = require('../models/User');
const { composeAndUpload } = require('../utils/composer');
const {
    findOccurrenceByDate,
    findNextOccurrence,
    resolveFestivalBaseImage,
} = require('../utils/festivalHelpers');

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
 * /api/scheduled/posted:
 *   get:
 *     summary: List user's successfully posted posts
 *     security:
 *       - bearerAuth: []
 */
router.get('/posted', auth, async (req, res) => {
    try {
        const posts = await ScheduledPost.find({
            user: req.user._id,
            status: 'posted'
        })
            .populate('festival')
            .sort({ scheduledAt: -1, createdAt: -1 });

        const normalizedPosts = posts
            .map((post) => {
                const imageUrl =
                    post.result?.composedImageUrl ||
                    post.result?.composed?.secure_url ||
                    post.result?.composed?.url ||
                    null;

                const postedAt =
                    post.result?.postedAt ||
                    post.platforms?.facebook?.postedAt ||
                    post.platforms?.instagram?.postedAt ||
                    post.scheduledAt ||
                    post.createdAt;

                if (!imageUrl) {
                    return null;
                }

                return {
                    _id: post._id,
                    status: post.status,
                    scheduledAt: post.scheduledAt,
                    createdAt: post.createdAt,
                    postedAt,
                    imageUrl,
                    festival: post.festival,
                    platforms: post.platforms || {}
                };
            })
            .filter(Boolean)
            .sort((left, right) => new Date(right.postedAt).getTime() - new Date(left.postedAt).getTime());

        res.json({ posts: normalizedPosts });
    } catch (err) {
        console.error('List posted posts error:', err);
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
        const { festivalId, scheduledAt, festivalDate, selectedBaseImageId } = req.body;
        const festival = await Festival.findById(festivalId);
        if (!festival) return res.status(404).json({ message: 'Festival not found' });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Require active subscription to schedule
        if (!user.subscription?.isActive) return res.status(403).json({ message: 'Subscription inactive' });

        let occurrence = null;
        if (festivalDate) {
            occurrence = findOccurrenceByDate(festival, festivalDate);
            if (!occurrence) {
                return res.status(400).json({ message: 'Selected festival date is invalid for this festival' });
            }
        } else {
            occurrence = findNextOccurrence(festival, new Date());
        }

        const resolvedImage = resolveFestivalBaseImage(festival, selectedBaseImageId);

        const scheduled = new ScheduledPost({
            user: req.user._id,
            festival: festivalId,
            festivalDate: occurrence?.date || null,
            festivalYear: occurrence?.year || null,
            selectedBaseImageId: resolvedImage.id || null,
            resolvedBaseImageUrl: resolvedImage.url || null,
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

        const resolvedImage = scheduled.resolvedBaseImageUrl
            ? {
                  url: scheduled.resolvedBaseImageUrl,
                  id: scheduled.selectedBaseImageId || null,
              }
            : resolveFestivalBaseImage(scheduled.festival, scheduled.selectedBaseImageId);

        if (!resolvedImage.url) {
            return res.status(400).json({ message: 'Festival has no base image configured' });
        }

        // compose and upload
        const result = await composeAndUpload(resolvedImage.url, user.profile.footerImage.url);

        scheduled.status = 'posted';
        scheduled.resolvedBaseImageUrl = resolvedImage.url;
        scheduled.result = { composed: result };
        await scheduled.save();

        res.json({ message: 'Processed', result });
    } catch (err) {
        console.error('Process scheduled error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
