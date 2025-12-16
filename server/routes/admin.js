const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { uploadStream, cloudinary } = require('../utils/cloudinary');
const User = require('../models/User');
const Festival = require('../models/Festival');
const auth = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../tmp') });

// Simple admin check - replace with real role-based auth
const adminOnly = (req, res, next) => {
    // For now, require user's email to be in ADMIN_EMAIL env var list
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!req.user || req.user.email !== adminEmail) {
        return res.status(403).json({ message: 'Forbidden - admin only' });
    }
    next();
};

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
router.get('/users', auth, adminOnly, async (req, res) => {
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
router.post('/users/:id/footer', auth, adminOnly, upload.single('footer'), async (req, res) => {
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
router.post('/festivals', auth, adminOnly, upload.single('baseImage'), async (req, res) => {
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

module.exports = router;

/**
 * @swagger
 * /api/admin/import-festivals:
 *   post:
 *     summary: Import festivals from CSV (admin)
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *     security:
 *       - bearerAuth: []
 */
router.post('/import-festivals', auth, adminOnly, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const csvPath = req.file.path;
        const csv = require('csv-parser');
        const festivals = [];
        const fs = require('fs');

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    // Expect CSV with festival,date,category,baseImageUrl,description
                    festivals.push({
                        name: row.festival || row.name,
                        date: new Date(row.date),
                        category: row.category || 'all',
                        baseImage: { url: row.baseImageUrl || row.baseImage || '' },
                        description: row.description || ''
                    });
                })
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        // cleanup
        fs.unlinkSync(csvPath);

        const Festival = require('../models/Festival');
        if (festivals.length) {
            await Festival.insertMany(festivals);
        }

        res.json({ message: 'Imported', count: festivals.length });
    } catch (err) {
        console.error('Import CSV error:', err);
        res.status(500).json({ message: 'Import failed' });
    }
});
