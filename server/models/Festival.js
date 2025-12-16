const mongoose = require('mongoose');

const festivalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    category: { type: String, enum: ['hindu', 'muslim', 'other', 'all'], default: 'all' },
    baseImage: {
        url: String,
        public_id: String
    },
    description: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Festival', festivalSchema);
