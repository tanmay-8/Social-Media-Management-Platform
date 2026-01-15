const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/festivals
// @desc    Get festivals based on user's category preference
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const userCategory = req.user.profile?.festivalCategory || 'all';
        const Festival = require('../models/Festival');
        
        // Build query
        const query = {};
        
        // Filter by year if provided
        if (req.query.year) {
            query.year = parseInt(req.query.year);
        }
        
        // Filter by category if not 'all'
        if (userCategory !== 'all') {
            query.category = userCategory;
        }

        // Get all festivals matching criteria
        const allFestivals = await Festival.find(query).sort({ date: 1 });
        
        // Filter for today and future festivals only
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const festivals = allFestivals.filter(festival => {
            const festivalDate = new Date(festival.date);
            festivalDate.setHours(0, 0, 0, 0);
            return festivalDate >= today;
        });
        
        res.json({
            festivals,
            category: userCategory,
            year: req.query.year ? parseInt(req.query.year) : 'all',
            count: festivals.length
        });
    } catch (error) {
        console.error('Get festivals error:', error);
        res.status(500).json({ message: 'Server error fetching festivals' });
    }
});

module.exports = router;

