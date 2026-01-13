const mongoose = require('mongoose');

const scheduledPostSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    festival: { type: mongoose.Schema.Types.ObjectId, ref: 'Festival', required: true },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ['pending','posted','failed','skipped'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    autoCreated: { type: Boolean, default: false }, // Tracks if created by auto-scheduler
    platforms: { 
        facebook: { 
            status: { type: String, enum: ['pending','posted','failed'], default: 'pending' },
            mediaId: String,
            error: String,
            postedAt: Date
        },
        instagram: { 
            status: { type: String, enum: ['pending','posted','failed'], default: 'pending' },
            mediaId: String,
            error: String,
            postedAt: Date
        }
    },
    result: { type: mongoose.Schema.Types.Mixed }, // For backward compatibility
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScheduledPost', scheduledPostSchema);
