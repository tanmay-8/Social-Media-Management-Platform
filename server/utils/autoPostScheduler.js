const cron = require('node-cron');
const ScheduledPost = require('../models/ScheduledPost');
const Festival = require('../models/Festival');
const User = require('../models/User');
const { composeAndUpload } = require('./composer');
const { postToInstagram } = require('./instagramAPI');
const { postToFacebook, getUserPages, getPageAccessToken } = require('./facebookAPI');

/**
 * Auto-posting scheduler
 * Checks for scheduled posts and publishes them to social media
 * All times use Indian Standard Time (IST - Asia/Kolkata)
 */

// Helper function to get current time in IST
function getISTTime() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

let schedulerRunning = false;

/**
 * Process a single scheduled post
 * @param {Object} scheduledPost - ScheduledPost document
 */
async function processScheduledPost(scheduledPost) {
    try {
        console.log(`\n🔄 Processing scheduled post ${scheduledPost._id}...`);

        // Populate festival and user data
        await scheduledPost.populate('festival');
        await scheduledPost.populate('user');

        const festival = scheduledPost.festival;
        const user = scheduledPost.user;

        if (!festival || !user) {
            console.error('❌ Festival or user not found');
            scheduledPost.status = 'failed';
            scheduledPost.result = { error: 'Festival or user not found' };
            await scheduledPost.save();
            return;
        }

        console.log(`📅 Festival: ${festival.name}`);
        console.log(`👤 User: ${user.name} (${user.email})`);

        // Check if user has footer image
        if (!user.profile?.footerImage?.url) {
            console.error('❌ User has no footer image');
            scheduledPost.status = 'failed';
            scheduledPost.result = { error: 'User has no footer image' };
            await scheduledPost.save();
            return;
        }

        // Check if festival has base image
        if (!festival.baseImage?.url) {
            console.error('❌ Festival has no base image');
            scheduledPost.status = 'failed';
            scheduledPost.result = { error: 'Festival has no base image' };
            await scheduledPost.save();
            return;
        }

        // Step 1: Compose the image
        console.log('🎨 Composing image...');
        const composedImage = await composeAndUpload(
            festival.baseImage.url,
            user.profile.footerImage.url,
            { width: 1080, height: 1080 }
        );

        console.log(`✅ Image composed: ${composedImage.secure_url}`);

        const caption = `${festival.name}\n\n#festival #celebration`;

        // Initialize platforms tracking if not exists
        if (!scheduledPost.platforms) {
            scheduledPost.platforms = {
                facebook: { status: 'pending' },
                instagram: { status: 'pending' }
            };
        }

        // Step 2: Post to Instagram (if connected)
        if (user.profile?.instagramAccessToken && user.profile?.instagramBusinessId) {
            console.log('📸 Posting to Instagram...');
            try {
                const instagramResult = await postToInstagram(
                    user.profile.instagramAccessToken,
                    user.profile.instagramBusinessId,
                    composedImage.secure_url,
                    caption
                );

                if (instagramResult.success) {
                    console.log('✅ Posted to Instagram!');
                    scheduledPost.platforms.instagram = {
                        status: 'posted',
                        mediaId: instagramResult.mediaId,
                        postedAt: new Date()
                    };
                } else {
                    console.error('❌ Instagram post failed:', instagramResult.error);
                    scheduledPost.platforms.instagram = {
                        status: 'failed',
                        error: instagramResult.error
                    };
                }
            } catch (error) {
                console.error('❌ Instagram posting exception:', error.message);
                scheduledPost.platforms.instagram = {
                    status: 'failed',
                    error: error.message
                };
            }
        } else {
            console.log('⏭️  Instagram not connected, skipping...');
            scheduledPost.platforms.instagram = { status: 'pending' };
        }

        // Step 3: Post to Facebook (with auto-discovery if needed)
        let facebookPageAccessToken = user.profile?.facebookPageAccessToken;
        let facebookPageId = user.profile?.facebookPageId;

        // If no page is connected but user has Facebook access token, try to discover pages
        if (!facebookPageId && user.profile?.facebookAccessToken) {
            console.log('🔍 No Facebook Page connected, attempting auto-discovery...');
            try {
                const pagesResult = await getUserPages(user.profile.facebookAccessToken);
                
                if (pagesResult.success && pagesResult.pages.length > 0) {
                    const firstPage = pagesResult.pages[0];
                    console.log(`📄 Found ${pagesResult.pages.length} page(s), using: ${firstPage.name} (${firstPage.id})`);
                    
                    // Get page access token
                    const pageTokenResult = await getPageAccessToken(
                        user.profile.facebookAccessToken,
                        firstPage.id
                    );

                    if (pageTokenResult.success) {
                        facebookPageId = firstPage.id;
                        facebookPageAccessToken = pageTokenResult.pageAccessToken;

                        // Save to user profile for future use
                        user.profile.facebookPageId = firstPage.id;
                        user.profile.facebookPageName = firstPage.name;
                        user.profile.facebookPageAccessToken = pageTokenResult.pageAccessToken;
                        await user.save();
                        
                        console.log('✅ Auto-discovered page saved to profile for future posting');
                    } else {
                        console.error('❌ Failed to get page access token:', pageTokenResult.error);
                    }
                } else {
                    console.log('⚠️  No Facebook Pages found for this account');
                }
            } catch (error) {
                console.error('❌ Page auto-discovery failed:', error.message);
            }
        }

        // Now attempt to post if we have page credentials
        if (facebookPageAccessToken && facebookPageId) {
            console.log('📘 Posting to Facebook...');
            try {
                const facebookResult = await postToFacebook(
                    facebookPageAccessToken,
                    facebookPageId,
                    composedImage.secure_url,
                    caption
                );

                if (facebookResult.success) {
                    console.log('✅ Posted to Facebook!');
                    scheduledPost.platforms.facebook = {
                        status: 'posted',
                        mediaId: facebookResult.postId,
                        postedAt: new Date()
                    };
                } else {
                    console.error('❌ Facebook post failed:', facebookResult.error);
                    scheduledPost.platforms.facebook = {
                        status: 'failed',
                        error: facebookResult.error
                    };
                }
            } catch (error) {
                console.error('❌ Facebook posting exception:', error.message);
                scheduledPost.platforms.facebook = {
                    status: 'failed',
                    error: error.message
                };
            }
        } else {
            console.log('⏭️  Facebook not connected, skipping...');
            scheduledPost.platforms.facebook = { status: 'pending' };
        }

        // Update scheduled post status based on platform results
        const successCount = Object.values(scheduledPost.platforms).filter(p => p.status === 'posted').length;
        const totalPlatforms = Object.values(scheduledPost.platforms).filter(p => p.status !== 'pending').length;
        
        if (successCount > 0) {
            scheduledPost.status = 'posted';
            scheduledPost.result = {
                composedImageUrl: composedImage.secure_url,
                platforms: scheduledPost.platforms,
                postedAt: new Date()
            };
            console.log(`✅ Successfully posted to ${successCount}/${totalPlatforms} platform(s)!`);
        } else if (totalPlatforms === 0) {
            // No platforms connected
            scheduledPost.status = 'skipped';
            scheduledPost.result = {
                reason: 'No social media platforms connected'
            };
            console.log('⏭️  Skipped: No platforms connected');
        } else {
            // Some or all platforms failed
            scheduledPost.status = 'failed';
            scheduledPost.result = {
                composedImageUrl: composedImage.secure_url,
                platforms: scheduledPost.platforms,
                error: `Failed on all ${totalPlatforms} connected platform(s)`
            };
            console.error('❌ All platforms failed');
        }

        scheduledPost.attempts = (scheduledPost.attempts || 0) + 1;
        await scheduledPost.save();

    } catch (error) {
        console.error('❌ Error processing scheduled post:', error);
        scheduledPost.status = 'failed';
        scheduledPost.result = { error: error.message };
        scheduledPost.attempts = (scheduledPost.attempts || 0) + 1;
        await scheduledPost.save();
    }
}

/**
 * Check and process all pending scheduled posts
 */
async function checkAndPostScheduled() {
    if (schedulerRunning) {
        console.log('⏳ Scheduler already running, skipping...');
        return;
    }

    schedulerRunning = true;

    try {
        const now = getISTTime();
        console.log(`\n⏰ [${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST] Checking for scheduled posts...`);

        // Find all pending posts that are due (scheduledAt <= now)
        const pendingPosts = await ScheduledPost.find({
            status: 'pending',
            scheduledAt: { $lte: now }
        }).limit(10); // Process max 10 at a time

        if (pendingPosts.length === 0) {
            console.log('✨ No pending posts to process');
            schedulerRunning = false;
            return;
        }

        console.log(`📋 Found ${pendingPosts.length} pending post(s) to process`);

        // Process each post
        for (const post of pendingPosts) {
            await processScheduledPost(post);
            // Small delay between posts to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`\n✅ Finished processing ${pendingPosts.length} post(s)\n`);

    } catch (error) {
        console.error('❌ Scheduler error:', error);
    } finally {
        schedulerRunning = false;
    }
}

/**
 * Start the auto-posting cron job
 * Runs every hour at minute 0
 */
function startScheduler() {
    console.log('🚀 Starting auto-posting scheduler (IST timezone)...');
    console.log('⏰ Will check for scheduled posts every hour (IST)');

    // Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00) in IST
    // Cron format: minute hour day month dayOfWeek
    cron.schedule('0 * * * *', async () => {
        await checkAndPostScheduled();
    }, {
        timezone: 'Asia/Kolkata'
    });

    // Also run immediately on startup to catch any missed posts
    setTimeout(async () => {
        console.log('🔍 Running initial check for scheduled posts...');
        await checkAndPostScheduled();
    }, 5000); // Wait 5 seconds after server start

    console.log('✅ Scheduler started successfully!');
}

/**
 * Manual trigger for testing
 */
async function manualTrigger() {
    console.log('🔧 Manual scheduler trigger...');
    await checkAndPostScheduled();
}

module.exports = {
    startScheduler,
    manualTrigger,
    checkAndPostScheduled
};
