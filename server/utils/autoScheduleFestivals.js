const cron = require('node-cron');
const Festival = require('../models/Festival');
const User = require('../models/User');
const ScheduledPost = require('../models/ScheduledPost');
const { normalizeYearDates, resolveFestivalBaseImage } = require('./festivalHelpers');

/**
 * Auto-schedule festivals for all subscribed users
 * Runs daily at 7:00 AM IST (Indian Standard Time)
 * Creates scheduled posts for all festivals happening today
 * for users with active subscriptions
 */

// Helper function to get current time in IST
function getISTTime() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

/**
 * Get the next 7:00 AM IST time for scheduling
 * Returns date object set to 7:00 AM IST
 */
function getScheduleTime() {
    const now = getISTTime();
    const scheduleTime = new Date(now);
    scheduleTime.setHours(7, 0, 0, 0); // 7:00 AM IST
    
    // If we're past 7:00 AM today, schedule for tomorrow
    if (scheduleTime <= now) {
        scheduleTime.setDate(scheduleTime.getDate() + 1);
    }
    
    return scheduleTime;
}

/**
 * Get today's date components (year, month, day)
 */
function getTodayDate() {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1, // JavaScript months are 0-indexed
        day: now.getDate()
    };
}

/**
 * Auto-schedule festivals for today
 */
async function autoScheduleFestivalsForToday() {
    try {
        console.log('\n🎉 ========================================');
        console.log('   AUTO-SCHEDULING FESTIVALS');
        console.log('   ========================================');
        
        const now = new Date();
        console.log(`⏰ Time: ${now.toISOString()}`);
        
        // Get today's date components
        const today = getTodayDate();
        console.log(`📅 Looking for festivals on ${today.year}-${today.month}-${today.day}`);
        
        // Find festivals and match against configured yearDates (legacy date supported by helper).
        const festivals = await Festival.find({});
        const todaysFestivals = festivals
            .map((festival) => {
                const matchingOccurrence = normalizeYearDates(festival).find((entry) => {
                    return (
                        entry.year === today.year &&
                        entry.date.getMonth() + 1 === today.month &&
                        entry.date.getDate() === today.day
                    );
                });

                if (!matchingOccurrence) {
                    return null;
                }

                const resolvedImage = resolveFestivalBaseImage(festival);

                return {
                    festival,
                    occurrence: matchingOccurrence,
                    resolvedImage,
                };
            })
            .filter(Boolean);
        
        console.log(`\n✨ Found ${todaysFestivals.length} festival(s) today:`);
        todaysFestivals.forEach(({ festival, occurrence }) => {
            console.log(`   📍 ${festival.name} (${festival.category || 'general'}) - ${occurrence.year}`);
        });
        
        if (todaysFestivals.length === 0) {
            console.log('   No festivals today. Skipping...\n');
            return { created: 0, skipped: 0, error: 0 };
        }
        
        // Find all users with active subscriptions
        const activeUsers = await User.find({
            'subscription.isActive': true
        }).select('_id name email profile.footerImage');
        
        console.log(`\n👥 Found ${activeUsers.length} user(s) with active subscription(s)`);
        
        let stats = {
            created: 0,
            skipped: 0,
            error: 0,
            users: []
        };
        
        // For each user, create scheduled posts for matching festivals
        for (const user of activeUsers) {
            const userStats = {
                userId: user._id,
                email: user.email,
                name: user.name,
                scheduled: [],
                skipped: []
            };
            
            console.log(`\n👤 User: ${user.name} (${user.email})`);
            
            // Check if user has footer image (required for posting)
            if (!user.profile?.footerImage?.url) {
                console.log(`   ⏭️  No footer image. Skipping...`);
                stats.skipped++;
                userStats.skipped.push('No footer image');
                userStats.skipped.push('All festivals skipped');
                stats.users.push(userStats);
                continue;
            }
            
            console.log(`   🎯 Festivals to schedule: ${todaysFestivals.length}`);

            // For each festival, check if already scheduled
            for (const entry of todaysFestivals) {
                const { festival, occurrence, resolvedImage } = entry;
                try {
                    // Check if this user already has a scheduled post for this festival occurrence date.
                    const occurrenceStart = new Date(occurrence.date);
                    occurrenceStart.setHours(0, 0, 0, 0);
                    const occurrenceEnd = new Date(occurrenceStart);
                    occurrenceEnd.setDate(occurrenceEnd.getDate() + 1);

                    const existingPost = await ScheduledPost.findOne({
                        user: user._id,
                        festival: festival._id,
                        festivalDate: { $gte: occurrenceStart, $lt: occurrenceEnd }
                    });

                    if (existingPost) {
                        console.log(`      ⏭️  ${festival.name} - Already scheduled`);
                        userStats.skipped.push(`${festival.name} - Already scheduled`);
                        stats.skipped++;
                        continue;
                    }
                    
                    // Create scheduled post for today at 7:00 AM IST + spread offset
                    // The scheduledAt time will be used by the auto-posting scheduler
                    const postTime = getISTTime();
                    postTime.setHours(7, 0, 0, 0); // 7:00 AM IST
                    
                    const randomOffset = Math.floor(Math.random() * 30); // 0–30 min
                    const userOffset = user._id.toString().charCodeAt(0) % 30;
                    
                    postTime.setMinutes(postTime.getMinutes() + randomOffset + userOffset);
                    
                    const scheduledPost = new ScheduledPost({
                        user: user._id,
                        festival: festival._id,
                        festivalDate: occurrence.date,
                        festivalYear: occurrence.year,
                        selectedBaseImageId: resolvedImage.id || null,
                        resolvedBaseImageUrl: resolvedImage.url || null,
                        scheduledAt: postTime,
                        status: 'pending',
                        attempts: 0,
                        platforms: {
                            facebook: { status: 'pending' },
                            instagram: { status: 'pending' }
                        }
                    });
                    
                    await scheduledPost.save();
                    
                    console.log(`      ✅ ${festival.name} - Scheduled at ${postTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
                    userStats.scheduled.push(`${festival.name} - ${postTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
                    stats.created++;
                    
                } catch (err) {
                    console.error(`      ❌ Error scheduling ${festival.name}:`, err.message);
                    userStats.skipped.push(`${festival.name} - Error: ${err.message}`);
                    stats.error++;
                }
            }
            
            stats.users.push(userStats);
        }
        
        console.log('\n📊 ========================================');
        console.log(`   RESULTS:`);
        console.log(`   ✅ Created: ${stats.created}`);
        console.log(`   ⏭️  Skipped: ${stats.skipped}`);
        console.log(`   ❌ Errors: ${stats.error}`);
        console.log('   ========================================\n');
        
        return stats;
        
    } catch (error) {
        console.error('❌ Auto-schedule festivals error:', error);
        return { created: 0, skipped: 0, error: 1 };
    }
}

/**
 * Start the auto-scheduling cron job
 * Runs daily at 7:00 AM IST (when the posts should be made)
 * Also runs on server startup
 */
function startFestivalScheduler() {
    console.log('\n🚀 Starting Festival Auto-Scheduler (IST timezone)...');
    
    // Calculate time until next 7:00 AM IST
    const scheduleTime = getScheduleTime();
    const now = getISTTime();
    const msUntilSchedule = scheduleTime.getTime() - now.getTime();
    const hoursUntil = Math.floor(msUntilSchedule / (1000 * 60 * 60));
    const minutesUntil = Math.floor((msUntilSchedule % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log(`⏰ Current time: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
    console.log(`⏰ Next run: ${scheduleTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
    console.log(`   (in ${hoursUntil}h ${minutesUntil}m)`);
    
    // Run every day at 7:00 AM IST
    // Cron format: minute hour day month dayOfWeek
    // 0 7 * * * = Every day at 7:00 AM
    cron.schedule('0 7 * * *', async () => {
        console.log('\n⏰ Festival Auto-Scheduler triggered (IST)');
        await autoScheduleFestivalsForToday();
    }, {
        timezone: 'Asia/Kolkata'
    });
    
    // Also run on startup after a small delay to catch any festivals from overnight
    setTimeout(async () => {
        console.log('🔍 Running initial festival auto-schedule check...');
        await autoScheduleFestivalsForToday();
    }, 3000); // Wait 3 seconds after startup
    
    console.log('✅ Festival Auto-Scheduler started successfully!\n');
}

/**
 * Manual trigger for testing or admin use
 */
async function manualTrigger() {
    console.log('🔧 Manual Festival Auto-Schedule trigger...');
    return await autoScheduleFestivalsForToday();
}

module.exports = {
    startFestivalScheduler,
    manualTrigger,
    autoScheduleFestivalsForToday,
    getTodayDate,
    getScheduleTime
};
