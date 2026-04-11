const mongoose = require('mongoose');

const festivalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    // Legacy single-date fields retained for backward compatibility.
    date: { type: Date },
    year: { type: Number },
    yearDates: [{
        year: { type: Number, required: true },
        date: { type: Date, required: true }
    }],
    category: { type: String, enum: ['hindu', 'muslim', 'other', 'all'], default: 'all' },
    isRecurring: { type: Boolean, default: true }, // Does this festival date change yearly?
    // Legacy single image retained for backward compatibility.
    baseImage: {
        url: String,
        public_id: String
    },
    baseImages: [{
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    defaultBaseImageId: { type: mongoose.Schema.Types.ObjectId },
    description: String,
    createdAt: { type: Date, default: Date.now }
});

// Compound index for efficient queries by year and category
festivalSchema.index({ year: 1, category: 1 });
festivalSchema.index({ date: 1, year: 1 });
festivalSchema.index({ 'yearDates.year': 1, category: 1 });
festivalSchema.index({ 'yearDates.date': 1 });

module.exports = mongoose.model('Festival', festivalSchema);
