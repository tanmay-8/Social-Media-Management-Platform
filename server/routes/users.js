const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadStream } = require('../utils/cloudinary');
const upload = multer({ dest: path.join(__dirname, '../tmp') });

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().trim(),
    body('instagramHandle').optional().trim(),
    body('facebookPageId').optional().trim(),
    body('festivalCategory').optional().isIn(['all', 'hindu', 'muslim']).withMessage('Invalid festival category')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, phone, instagramHandle, facebookPageId, festivalCategory } = req.body;

        const updateData = {
            updatedAt: new Date()
        };

        if (name) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        
        if (instagramHandle !== undefined || facebookPageId !== undefined || festivalCategory !== undefined) {
            updateData.profile = {
                ...(req.user.profile ? req.user.profile.toObject() : {}),
                ...(instagramHandle !== undefined && { instagramHandle }),
                ...(facebookPageId !== undefined && { facebookPageId }),
                ...(festivalCategory !== undefined && { festivalCategory })
            };
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @swagger
 * /api/users/footer:
 *   post:
 *     summary: Upload user's footer image
 *     consumes:
 *       - multipart/form-data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: formData
 *         name: footer
 *         type: file
 *     responses:
 *       200:
 *         description: Footer uploaded
 */
router.post('/footer', auth, upload.single('footer'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const filePath = req.file.path;
        const stream = fs.createReadStream(filePath);
        const result = await uploadStream(stream, { folder: 'footers' });
        fs.unlinkSync(filePath);

        const user = await User.findById(req.user._id);
        user.profile = user.profile || {};
        user.profile.footerImage = { url: result.secure_url, public_id: result.public_id };
        await user.save();

        res.json({ message: 'Footer uploaded', footer: user.profile.footerImage });
    } catch (err) {
        console.error('User footer upload error:', err);
        res.status(500).json({ message: 'Upload failed' });
    }
});

module.exports = router;


