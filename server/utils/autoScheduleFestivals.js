const cron = require('node-cron');
const Festival = require('../models/Festival');
const User = require('../models/User');
const ScheduledPost = require('../models/ScheduledPost');

/**
 * Auto-schedule festivals for users with matching preferences
 * Runs daily at 7:00 AM (server timezone)
 * Creates scheduled posts for all festivals happening today
 * for users with active subscriptions and matching festival preferences
 */

/**
 * Get the next 7:00 AM time for scheduling
 * Returns date object set to 7:00 AM
 */
function getScheduleTime() {
    const now = new Date();
    const scheduleTime = new Date(now);
    scheduleTime.setHours(7, 0, 0, 0); // 7:00 AM
    
    // If we're past 7:00 AM today, schedule for tomorrow
    if (scheduleTime <= now) {
        scheduleTime.setDate(scheduleTime.getDate() + 1);
    }
    
    return scheduleTime;
}

/**
 * Check if a festival matches user's preference
 */
function festivalMatchesPreference(festival, userPreference) {
    // User preference is stored as category
    // Festival preferences: 'all', 'hindu', 'muslim', 'christian', 'sikh', 'buddhist', 'jain'
    
    if (userPreference === 'all') {
        return true; // User wants all festivals
    }
    
    // Check if festival category matches user preference
    return festival.category?.toLowerCase() === userPreference?.toLowerCase();
}

/**
 * Get start and end of today
 */
function getTodayDateRange() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    return { startOfDay, endOfDay };
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
        
        // Get today's date range
        const { startOfDay, endOfDay } = getTodayDateRange();
        console.log(`📅 Looking for festivals between ${startOfDay.toDateString()} and ${endOfDay.toDateString()}`);
        
        // Find all festivals for today
        const todaysFestivals = await Festival.find({
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });
        
        console.log(`\n✨ Found ${todaysFestivals.length} festival(s) today:`);
        todaysFestivals.forEach(f => {
            console.log(`   📍 ${f.name} (${f.category || 'general'})`);
        });
        
        if (todaysFestivals.length === 0) {
            console.log('   No festivals today. Skipping...\n');
            return { created: 0, skipped: 0, error: 0 };
        }
        
        // Find all users with active subscriptions
        const activeUsers = await User.find({
            'subscription.isActive': true
        }).select('_id name email festivalPreference profile.footerImage');
        
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
            
            // Get user's festival preference (defaults to 'all')
            const userPreference = user.profile?.festivalCategory || 'all';
            
            console.log(`\n👤 User: ${user.name} (${user.email})`);
            console.log(`   Preference: ${userPreference}`);
            
            // Check if user has footer image (required for posting)
            if (!user.profile?.footerImage?.url) {
                console.log(`   ⏭️  No footer image. Skipping...`);
                stats.skipped++;
                userStats.skipped.push('No footer image');
                userStats.skipped.push('All festivals skipped');
                stats.users.push(userStats);
                continue;
            }
            
            // Filter festivals that match user preference
            const matchingFestivals = todaysFestivals.filter(festival => 
                festivalMatchesPreference(festival, userPreference)
            );
            
            console.log(`   🎯 Matching festivals: ${matchingFestivals.length}`);
            
            if (matchingFestivals.length === 0) {
                console.log(`   ⏭️  No matching festivals for this user's preference`);
                stats.skipped++;
                userStats.skipped.push('No matching festivals');
                stats.users.push(userStats);
                continue;
            }
            
            // For each matching festival, check if already scheduled
            for (const festival of matchingFestivals) {
                try {
                    // Check if this user already has a scheduled post for this festival today
                    const existingPost = await ScheduledPost.findOne({
                        user: user._id,
                        festival: festival._id,
                        scheduledAt: {
                            $gte: startOfDay,
                            $lte: endOfDay
                        }
                    });
                    
                    if (existingPost) {
                        console.log(`      ⏭️  ${festival.name} - Already scheduled`);
                        userStats.skipped.push(`${festival.name} - Already scheduled`);
                        stats.skipped++;
                        continue;
                    }
                    
                    // Create scheduled post for today at 7:00 AM local time
                    // The scheduledAt time will be used by the auto-posting scheduler
                    const postTime = new Date();
                    postTime.setHours(7, 0, 0, 0); // 7:00 AM
                    
                    const scheduledPost = new ScheduledPost({
                        user: user._id,
                        festival: festival._id,
                        scheduledAt: postTime,
                        status: 'pending',
                        attempts: 0
                    });
                    
                    await scheduledPost.save();
                    
                    console.log(`      ✅ ${festival.name} - Scheduled for 7:00 AM`);
                    userStats.scheduled.push(`${festival.name} - 7:00 AM`);
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
 * Runs daily at 7:00 AM (when the posts should be made)
 * Also runs on server startup
 */
function startFestivalScheduler() {
    console.log('\n🚀 Starting Festival Auto-Scheduler...');
    
    // Calculate time until next 7:00 AM
    const scheduleTime = getScheduleTime();
    const now = new Date();
    const msUntilSchedule = scheduleTime.getTime() - now.getTime();
    const hoursUntil = Math.floor(msUntilSchedule / (1000 * 60 * 60));
    const minutesUntil = Math.floor((msUntilSchedule % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log(`⏰ Next run: ${scheduleTime.toLocaleString()}`);
    console.log(`   (in ${hoursUntil}h ${minutesUntil}m)`);
    
    // Run every day at 7:00 AM
    // Cron format: minute hour day month dayOfWeek
    // 0 7 * * * = Every day at 7:00 AM
    cron.schedule('0 7 * * *', async () => {
        console.log('\n⏰ Festival Auto-Scheduler triggered');
        await autoScheduleFestivalsForToday();
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
    festivalMatchesPreference,
    getTodayDateRange,
    getScheduleTime
};
