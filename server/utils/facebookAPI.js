const axios = require('axios');

/**
 * Facebook Graph API Integration
 * Docs: https://developers.facebook.com/docs/graph-api
 */

const FACEBOOK_GRAPH_API_VERSION = 'v21.0';
const FACEBOOK_GRAPH_URL = `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}`;

/**
 * Post an image to Facebook Page
 * @param {string} accessToken - User's Facebook access token
 * @param {string} pageId - Facebook Page ID
 * @param {string} imageUrl - Public URL of the image to post
 * @param {string} message - Post message (optional)
 * @returns {Promise<Object>} - Posted photo info
 */
async function postToFacebook(accessToken, pageId, imageUrl, message = '') {
    try {
        console.log('📘 Posting to Facebook Page...');
        
        const response = await axios.post(
            `${FACEBOOK_GRAPH_URL}/${pageId}/photos`,
            {
                url: imageUrl,
                message: message,
                access_token: accessToken
            }
        );

        const postId = response.data.post_id;
        const photoId = response.data.id;
        
        console.log(`✅ Successfully posted to Facebook! Post ID: ${postId}`);

        return {
            success: true,
            postId: postId,
            photoId: photoId,
            platform: 'facebook'
        };

    } catch (error) {
        console.error('❌ Facebook posting error:', error.response?.data || error.message);
        
        if (error.response?.data?.error) {
            const apiError = error.response.data.error;
            return {
                success: false,
                error: apiError.message,
                errorCode: apiError.code,
                errorType: apiError.type,
                platform: 'facebook'
            };
        }

        return {
            success: false,
            error: error.message,
            platform: 'facebook'
        };
    }
}

/**
 * Check if Facebook access token is valid
 * @param {string} accessToken - User's Facebook access token
 * @returns {Promise<Object>} - Token info
 */
async function validateFacebookToken(accessToken) {
    try {
        const response = await axios.get(
            `${FACEBOOK_GRAPH_URL}/me`,
            {
                params: {
                    fields: 'id,name,email',
                    access_token: accessToken
                }
            }
        );

        return {
            valid: true,
            data: response.data
        };
    } catch (error) {
        console.error('❌ Facebook token validation error:', error.response?.data || error.message);
        return {
            valid: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

/**
 * Get user's Facebook Pages
 * @param {string} accessToken - User's Facebook access token
 * @returns {Promise<Array>} - List of pages user manages
 */
async function getUserPages(accessToken) {
    try {
        console.log('🔍 [getUserPages] Requesting Facebook pages with Instagram data...');
        console.log('🔍 [getUserPages] API URL:', `${FACEBOOK_GRAPH_URL}/me/accounts`);
        console.log('🔍 [getUserPages] Fields requested: id,name,access_token,instagram_business_account{id,username,profile_picture_url}');
        
        const response = await axios.get(
            `${FACEBOOK_GRAPH_URL}/me/accounts`,
            {
                params: {
                    fields: 'id,name,access_token',
                    access_token: accessToken
                }
            }
        );

        console.log(`✅ Fetched ${response.data.data.length} Facebook pages`);
        console.log('📋 [getUserPages] Raw response data:', JSON.stringify(response.data.data, null, 2));
        
        // Log which pages have Instagram connected
        response.data.data.forEach(page => {
            if (page.instagram_business_account) {
                console.log(`  📸 Page "${page.name}" (ID: ${page.id}) has Instagram: @${page.instagram_business_account.username} (ID: ${page.instagram_business_account.id})`);
            } else {
                console.log(`  📘 Page "${page.name}" (ID: ${page.id}) - no Instagram Business Account linked`);
            }
        });

        return {
            success: true,
            pages: response.data.data
        };
    } catch (error) {
        console.error('❌ Error fetching Facebook pages:', error.response?.data || error.message);
        if (error.response?.data?.error) {
            console.error('❌ Facebook API Error Details:', {
                message: error.response.data.error.message,
                type: error.response.data.error.type,
                code: error.response.data.error.code,
                fbtrace_id: error.response.data.error.fbtrace_id
            });
        }
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message,
            pages: []
        };
    }
}

/**
 * Get long-lived Page access token
 * @param {string} userAccessToken - User's access token
 * @param {string} pageId - Facebook Page ID
 * @returns {Promise<Object>} - Page access token info
 */
async function getPageAccessToken(userAccessToken, pageId) {
    try {
        const response = await axios.get(
            `${FACEBOOK_GRAPH_URL}/${pageId}`,
            {
                params: {
                    fields: 'access_token',
                    access_token: userAccessToken
                }
            }
        );

        return {
            success: true,
            pageAccessToken: response.data.access_token
        };
    } catch (error) {
        console.error('❌ Error getting page access token:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

/**
 * Exchange short-lived token for long-lived token
 * @param {string} shortLivedToken - Short-lived access token
 * @returns {Promise<Object>} - Long-lived token info
 */
async function exchangeForLongLivedToken(shortLivedToken) {
    try {
        const response = await axios.get(
            `${FACEBOOK_GRAPH_URL}/oauth/access_token`,
            {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: process.env.META_APP_ID,
                    client_secret: process.env.META_APP_SECRET,
                    fb_exchange_token: shortLivedToken
                }
            }
        );

        return {
            success: true,
            accessToken: response.data.access_token,
            expiresIn: response.data.expires_in, // Usually 60 days
            tokenType: response.data.token_type
        };
    } catch (error) {
        console.error('❌ Token exchange error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

module.exports = {
    postToFacebook,
    validateFacebookToken,
    getUserPages,
    getPageAccessToken,
    exchangeForLongLivedToken
};
