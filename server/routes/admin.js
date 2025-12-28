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
// Get all users
router.get('/users', auth, requireAdmin, async (req, res) => {
    const users = await User.find().select('-password');
    res.json({ users });
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

        const filePath = req.file.path;
        const stream = fs.createReadStream(filePath);
        const result = await uploadStream(stream, { folder: 'festivals' });
        fs.unlinkSync(filePath);

        const festival = new Festival({
            name,
            date: new Date(date),
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
 *         application/json:
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
 *     responses:
 *       200:
 *         description: Festival updated
 */
// Update festival
router.put('/festivals/:id', auth, requireAdmin, async (req, res) => {
    try {
        const { name, date, category, description } = req.body;
        const festival = await Festival.findById(req.params.id);
        
        if (!festival) {
            return res.status(404).json({ message: 'Festival not found' });
        }

        if (name) festival.name = name;
        if (date) festival.date = new Date(date);
        if (category) festival.category = category;
        if (description !== undefined) festival.description = description;

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
