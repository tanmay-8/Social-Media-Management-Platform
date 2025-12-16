const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/festivals
// @desc    Get festivals based on user's category preference
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const userCategory = req.user.profile?.festivalCategory || 'all';
        const festivals = [];

        await new Promise((resolve, reject) => {
            const csvPath = path.join(__dirname, '../festivals.csv');
            
            // Check if file exists
            if (!fs.existsSync(csvPath)) {
                return res.status(404).json({ message: 'Festivals data file not found' });
            }

            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    // Filter based on category
                    if (userCategory === 'all') {
                        festivals.push(row);
                    } else if (userCategory === 'hindu') {
                        // Filter Hindu festivals (you may need to adjust this logic based on your data)
                        const festivalName = row.festival?.toLowerCase() || '';
                        if (!festivalName.includes('muslim') && 
                            !festivalName.includes('islam') && 
                            !festivalName.includes('ramzan') &&
                            !festivalName.includes('eid')) {
                            festivals.push(row);
                        }
                    } else if (userCategory === 'muslim') {
                        // Filter Muslim festivals
                        const festivalName = row.festival?.toLowerCase() || '';
                        if (festivalName.includes('muslim') || 
                            festivalName.includes('islam') || 
                            festivalName.includes('ramzan') ||
                            festivalName.includes('eid')) {
                            festivals.push(row);
                        }
                    }
                })
                .on('end', () => {
                    res.json({
                        festivals,
                        category: userCategory,
                        count: festivals.length
                    });
                    resolve();
                })
                .on('error', (error) => {
                    console.error('CSV parsing error:', error);
                    reject(error);
                });
        });
    } catch (error) {
        console.error('Get festivals error:', error);
        res.status(500).json({ message: 'Server error fetching festivals' });
    }
});

module.exports = router;

