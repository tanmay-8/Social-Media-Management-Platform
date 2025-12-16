const mongoose = require('mongoose');

const scheduledPostSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    festival: { type: mongoose.Schema.Types.ObjectId, ref: 'Festival', required: true },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ['pending','posted','failed','skipped'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    result: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScheduledPost', scheduledPostSchema);
