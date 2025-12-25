const mongoose = require('mongoose');

const festivalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    year: { type: Number, required: true }, // Year for the festival (e.g., 2025, 2026)
    category: { type: String, enum: ['hindu', 'muslim', 'other', 'all'], default: 'all' },
    isRecurring: { type: Boolean, default: true }, // Does this festival date change yearly?
    baseImage: {
        url: String,
        public_id: String
    },
    description: String,
    createdAt: { type: Date, default: Date.now }
});

// Compound index for efficient queries by year and category
festivalSchema.index({ year: 1, category: 1 });
festivalSchema.index({ date: 1, year: 1 });

module.exports = mongoose.model('Festival', festivalSchema);
