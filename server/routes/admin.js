const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { uploadStream, cloudinary } = require('../utils/cloudinary');
const User = require('../models/User');
const Festival = require('../models/Festival');
const ScheduledPost = require('../models/ScheduledPost');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../tmp') });

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard statistics (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
// Get dashboard stats
router.get('/stats', auth, requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeSubscriptions = await User.countDocuments({ 'subscription.isActive': true });
        const totalFestivals = await Festival.countDocuments();
        const scheduledPosts = await ScheduledPost.countDocuments();

        res.json({
            totalUsers,
            activeSubscriptions,
            totalFestivals,
            scheduledPosts,
        });
    } catch (err) {
        console.error('Get stats error:', err);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
// Get all users with their images
router.get('/users', auth, requireAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password -facebookAccessToken -facebookPageAccessToken -instagramAccessToken');
        
        // Format response with image info
        const usersWithImages = users.map(user => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            authProvider: user.authProvider,
            subscription: user.subscription,
            profile: {
                instagramHandle: user.profile?.instagramHandle,
                facebookPageId: user.profile?.facebookPageId,
                festivalCategory: user.profile?.festivalCategory,
                profileImage: user.profile?.profileImage ? {
                    url: user.profile.profileImage.url,
                    source: user.profile.profileImage.source,
                    hasImage: true
                } : {
                    url: null,
                    source: 'default',
                    hasImage: false
                },
                footerImage: user.profile?.footerImage ? {
                    url: user.profile.footerImage.url,
                    hasImage: true
                } : {
                    url: null,
                    hasImage: false
                }
            },
            createdAt: user.createdAt
        }));
        
        res.json({ users: usersWithImages });
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get single user details (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 */
// Get single user with full details
router.get('/users/:id', auth, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -facebookAccessToken -facebookPageAccessToken -instagramAccessToken');
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        res.json({ user });
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ message: 'Failed to fetch user' });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}/profile-images:
 *   get:
 *     summary: Get user's profile and footer images for download (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User images
 */
// Get user's images (for admin to download)
router.get('/users/:id/profile-images', auth, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const images = {
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
            profileImage: user.profile?.profileImage?.url ? {
                url: user.profile.profileImage.url,
                public_id: user.profile.profileImage.public_id,
                source: user.profile.profileImage.source,
                downloadUrl: user.profile.profileImage.url + '?dl=1' // Force download
            } : null,
            footerImage: user.profile?.footerImage?.url ? {
                url: user.profile.footerImage.url,
                public_id: user.profile.footerImage.public_id,
                downloadUrl: user.profile.footerImage.url + '?dl=1'
            } : null
        };

        res.json({ images });
    } catch (err) {
        console.error('Get user images error:', err);
        res.status(500).json({ message: 'Failed to fetch images' });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}/footer:
 *   post:
 *     summary: Upload footer image for a user (admin)
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: formData
 *         name: footer
 *         type: file
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Footer uploaded
 */
// Upload footer image for a user (admin)
router.post('/users/:id/footer', auth, requireAdmin, upload.single('footer'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const filePath = req.file.path;
        const stream = fs.createReadStream(filePath);
        const result = await uploadStream(stream, { folder: 'footers' });
        // cleanup
        fs.unlinkSync(filePath);

        user.profile = user.profile || {};
        user.profile.footerImage = { url: result.secure_url, public_id: result.public_id };
        await user.save();

        res.json({ message: 'Footer uploaded', footer: user.profile.footerImage });
    } catch (err) {
        console.error('Upload footer error:', err);
        res.status(500).json({ message: 'Upload failed' });
    }
});

/**
 * @swagger
 * /api/admin/festivals:
 *   post:
 *     summary: Create festival with base image (admin)
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: name
 *         schema:
 *           type: string
 *       - in: formData
 *         name: date
 *         schema:
 *           type: string
 *       - in: formData
 *         name: category
 *         schema:
 *           type: string
 *       - in: formData
 *         name: description
 *         schema:
 *           type: string
 *       - in: formData
 *         name: baseImage
 *         type: file
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Festival created
 */
// Create festival with base image
router.post('/festivals', auth, requireAdmin, upload.single('baseImage'), async (req, res) => {
    try {
        const { name, date, category, description } = req.body;
        if (!name || !date) return res.status(400).json({ message: 'Name/date required' });

        if (!req.file) {
            return res.status(400).json({ message: 'Base image is required' });
        }

        const filePath = req.file.path;
        const stream = fs.createReadStream(filePath);
        const result = await uploadStream(stream, { folder: 'festivals' });
        fs.unlinkSync(filePath);

        const festivalDate = new Date(date);
        const year = festivalDate.getFullYear();

        const festival = new Festival({
            name,
            date: festivalDate,
            year,
            category: category || 'all',
            description: description || '',
            baseImage: { url: result.secure_url, public_id: result.public_id }
        });
        await festival.save();

        res.status(201).json({ message: 'Festival created', festival });
    } catch (err) {
        console.error('Create festival error:', err);
        res.status(500).json({ message: 'Failed to create festival' });
    }
});

/**
 * @swagger
 * /api/admin/festivals/{id}:
 *   put:
 *     summary: Update festival (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               date:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               baseImage:
 *                 type: file
 *     responses:
 *       200:
 *         description: Festival updated
 */
// Update festival with optional base image
router.put('/festivals/:id', auth, requireAdmin, upload.single('baseImage'), async (req, res) => {
    try {
        const { name, date, category, description } = req.body;
        const festival = await Festival.findById(req.params.id);
        
        if (!festival) {
            return res.status(404).json({ message: 'Festival not found' });
        }

        if (name) festival.name = name;
        if (date) {
            festival.date = new Date(date);
            festival.year = festival.date.getFullYear();
        }
        if (category) festival.category = category;
        if (description !== undefined) festival.description = description;

        // Handle image upload if provided
        if (req.file) {
            // Delete old image from Cloudinary if it exists
            if (festival.baseImage?.public_id) {
                try {
                    await cloudinary.uploader.destroy(festival.baseImage.public_id);
                } catch (deleteErr) {
                    console.error('Error deleting old image:', deleteErr);
                }
            }

            // Upload new image
            const filePath = req.file.path;
            const stream = fs.createReadStream(filePath);
            const result = await uploadStream(stream, { folder: 'festivals' });
            fs.unlinkSync(filePath);

            festival.baseImage = { url: result.secure_url, public_id: result.public_id };
        }

        await festival.save();
        
        res.json({ message: 'Festival updated successfully', festival });
    } catch (err) {
        console.error('Update festival error:', err);
        res.status(500).json({ message: 'Failed to update festival' });
    }
});

/**
 * @swagger
 * /api/admin/festivals/{id}:
 *   delete:
 *     summary: Delete festival (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Festival deleted
 */
// Delete festival
router.delete('/festivals/:id', auth, requireAdmin, async (req, res) => {
    try {
        const festival = await Festival.findById(req.params.id);
        
        if (!festival) {
            return res.status(404).json({ message: 'Festival not found' });
        }

        // Delete from cloudinary if exists
        if (festival.baseImage && festival.baseImage.public_id) {
            try {
                await cloudinary.uploader.destroy(festival.baseImage.public_id);
            } catch (cloudErr) {
                console.warn('Cloudinary deletion warning:', cloudErr);
            }
        }

        await Festival.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Festival deleted successfully' });
    } catch (err) {
        console.error('Delete festival error:', err);
        res.status(500).json({ message: 'Failed to delete festival' });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Update user details (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 */
// Update user
router.patch('/users/:id', auth, requireAdmin, async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (phone !== undefined) user.phone = phone;

        await user.save();
        
        res.json({ 
            message: 'User updated successfully', 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                subscription: user.subscription
            }
        });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ message: 'Failed to update user' });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Change user role (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: Role updated
 */
// Change user role
router.patch('/users/:id/role', auth, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be "user" or "admin"' });
        }

        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from removing their own admin role
        if (user._id.toString() === req.user._id.toString() && role === 'user') {
            return res.status(400).json({ message: 'Cannot remove your own admin privileges' });
        }

        user.role = role;
        await user.save();
        
        res.json({ 
            message: `User role updated to ${role}`, 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Update role error:', err);
        res.status(500).json({ message: 'Failed to update role' });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
// Delete user
router.delete('/users/:id', auth, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await User.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ message: 'Failed to delete user' });
    }
});

/**
 * @swagger
 * /api/admin/trigger-festival-scheduler:
 *   post:
 *     summary: Manually trigger festival auto-scheduling (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduler triggered successfully
 */
router.post('/trigger-festival-scheduler', auth, requireAdmin, async (req, res) => {
    try {
        const { manualTrigger } = require('../utils/autoScheduleFestivals');
        
        console.log('🔧 Admin triggered festival auto-scheduler');
        const result = await manualTrigger();
        
        res.json({
            message: 'Festival scheduler triggered successfully',
            result
        });
    } catch (error) {
        console.error('Festival scheduler trigger error:', error);
        res.status(500).json({ message: 'Failed to trigger scheduler', error: error.message });
    }
});

/**
 * @swagger
 * /api/admin/trigger-post-scheduler:
 *   post:
 *     summary: Manually trigger auto-posting scheduler (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduler triggered successfully
 */
router.post('/trigger-post-scheduler', auth, requireAdmin, async (req, res) => {
    try {
        const { manualTrigger } = require('../utils/autoPostScheduler');
        
        console.log('🔧 Admin triggered auto-posting scheduler');
        const result = await manualTrigger();
        
        res.json({
            message: 'Auto-posting scheduler triggered successfully',
            result
        });
    } catch (error) {
        console.error('Auto-posting scheduler trigger error:', error);
        res.status(500).json({ message: 'Failed to trigger scheduler', error: error.message });
    }
});

module.exports = router;

/**
 * @swagger
 * /api/admin/import-festivals:
 *   post:
 *     summary: Import festivals from JSON (admin)
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: JSON file with festivals array
 *     security:
 *       - bearerAuth: []
 */
router.post('/import-festivals', auth, requireAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        
        const filePath = req.file.path;
        const fs = require('fs');

        // Read and parse JSON file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        let festivalsData;
        
        try {
            festivalsData = JSON.parse(fileContent);
        } catch (parseError) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'Invalid JSON format' });
        }

        // Validate that it's an array
        if (!Array.isArray(festivalsData)) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: 'JSON must contain an array of festivals' });
        }

        // Transform JSON data to match Festival model
        const festivals = festivalsData.map(festival => ({
            name: festival.name,
            date: new Date(festival.date),
            year: festival.year || new Date(festival.date).getFullYear(),
            category: festival.category || 'all',
            isRecurring: festival.isRecurring !== undefined ? festival.isRecurring : true,
            baseImage: festival.baseImage || { url: null, public_id: null },
            description: festival.description || ''
        }));

        // cleanup file
        fs.unlinkSync(filePath);

        // Insert festivals
        if (festivals.length > 0) {
            await Festival.insertMany(festivals, { ordered: false });
        }

        res.json({ 
            message: 'Festivals imported successfully', 
            count: festivals.length 
        });
    } catch (err) {
        console.error('Import JSON error:', err);
        
        // Handle duplicate key errors
        if (err.code === 11000) {
            return res.status(200).json({ 
                message: 'Import completed with some duplicates skipped',
                count: err.insertedDocs?.length || 0
            });
        }
        
        res.status(500).json({ message: 'Import failed' });
    }
});
