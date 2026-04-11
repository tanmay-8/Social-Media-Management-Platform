const express = require('express');
const auth = require('../middleware/auth');
const Festival = require('../models/Festival');
const { normalizeYearDates, toFestivalResponse } = require('../utils/festivalHelpers');
const router = express.Router();

// @route   GET /api/festivals
// @desc    Get festivals available to the current user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const requestedYear = req.query.year ? parseInt(req.query.year, 10) : null;
        const allFestivals = await Festival.find({}).sort({ createdAt: -1 });

        // Filter for today and future festivals only (using normalized year-dates).
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const festivals = allFestivals
            .filter((festival) => {
                const entries = normalizeYearDates(festival);
                if (entries.length === 0) {
                    return false;
                }

                if (requestedYear && !entries.some((entry) => entry.year === requestedYear)) {
                    return false;
                }

                return entries.some((entry) => {
                    const dateOnly = new Date(entry.date);
                    dateOnly.setHours(0, 0, 0, 0);
                    return dateOnly >= today;
                });
            })
            .map((festival) => toFestivalResponse(festival, today))
            .sort((left, right) => {
                const leftDate = left.date ? new Date(left.date).getTime() : Number.MAX_SAFE_INTEGER;
                const rightDate = right.date ? new Date(right.date).getTime() : Number.MAX_SAFE_INTEGER;
                return leftDate - rightDate;
            });
        
        res.json({
            festivals,
            category: 'all',
            year: requestedYear || 'all',
            count: festivals.length
        });
    } catch (error) {
        console.error('Get festivals error:', error);
        res.status(500).json({ message: 'Server error fetching festivals' });
    }
});

module.exports = router;

