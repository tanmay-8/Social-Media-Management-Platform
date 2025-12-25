const axios = require('axios');

/**
 * Instagram Graph API Integration
 * Docs: https://developers.facebook.com/docs/instagram-api
 */

const INSTAGRAM_GRAPH_API_VERSION = 'v21.0';
const INSTAGRAM_GRAPH_URL = `https://graph.facebook.com/${INSTAGRAM_GRAPH_API_VERSION}`;

/**
 * Post an image to Instagram
 * @param {string} accessToken - User's Instagram access token
 * @param {string} instagramBusinessAccountId - Instagram Business Account ID
 * @param {string} imageUrl - Public URL of the image to post (must be publicly accessible)
 * @param {string} caption - Post caption (optional)
 * @returns {Promise<Object>} - Posted media info
 */
async function postToInstagram(accessToken, instagramBusinessAccountId, imageUrl, caption = '') {
    try {
        // Step 1: Create a container (media object)
        console.log('📸 Creating Instagram media container...');
        const containerResponse = await axios.post(
            `${INSTAGRAM_GRAPH_URL}/${instagramBusinessAccountId}/media`,
            {
                image_url: imageUrl,
                caption: caption,
                access_token: accessToken
            }
        );

        const creationId = containerResponse.data.id;
        console.log(`✅ Media container created: ${creationId}`);

        // Step 2: Publish the container (this actually posts it)
        console.log('📤 Publishing to Instagram...');
        const publishResponse = await axios.post(
            `${INSTAGRAM_GRAPH_URL}/${instagramBusinessAccountId}/media_publish`,
            {
                creation_id: creationId,
                access_token: accessToken
            }
        );

        const mediaId = publishResponse.data.id;
        console.log(`✅ Successfully posted to Instagram! Media ID: ${mediaId}`);

        return {
            success: true,
            mediaId: mediaId,
            creationId: creationId,
            platform: 'instagram'
        };

    } catch (error) {
        console.error('❌ Instagram posting error:', error.response?.data || error.message);
        
        // Handle specific errors
        if (error.response?.data?.error) {
            const apiError = error.response.data.error;
            return {
                success: false,
                error: apiError.message,
                errorCode: apiError.code,
                errorType: apiError.type,
                platform: 'instagram'
            };
        }

        return {
            success: false,
            error: error.message,
            platform: 'instagram'
        };
    }
}

/**
 * Check if Instagram access token is valid
 * @param {string} accessToken - User's Instagram access token
 * @returns {Promise<Object>} - Token info
 */
async function validateInstagramToken(accessToken) {
    try {
        const response = await axios.get(
            `${INSTAGRAM_GRAPH_URL}/me`,
            {
                params: {
                    fields: 'id,username',
                    access_token: accessToken
                }
            }
        );

        return {
            valid: true,
            data: response.data
        };
    } catch (error) {
        console.error('❌ Instagram token validation error:', error.response?.data || error.message);
        return {
            valid: false,
            error: error.response?.data?.error?.message || error.message
        };
    }
}

/**
 * Get Instagram Business Account ID from Facebook Page
 * @param {string} accessToken - User's access token
 * @param {string} facebookPageId - Facebook Page ID
 * @returns {Promise<string|null>} - Instagram Business Account ID
 */
async function getInstagramBusinessAccountId(accessToken, facebookPageId) {
    try {
        const response = await axios.get(
            `${INSTAGRAM_GRAPH_URL}/${facebookPageId}`,
            {
                params: {
                    fields: 'instagram_business_account',
                    access_token: accessToken
                }
            }
        );

        return response.data.instagram_business_account?.id || null;
    } catch (error) {
        console.error('❌ Error fetching Instagram Business Account ID:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Refresh long-lived access token
 * @param {string} shortLivedToken - Short-lived access token
 * @returns {Promise<Object>} - New long-lived token info
 */
async function exchangeForLongLivedToken(shortLivedToken) {
    try {
        const response = await axios.get(
            `${INSTAGRAM_GRAPH_URL}/oauth/access_token`,
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
    postToInstagram,
    validateInstagramToken,
    getInstagramBusinessAccountId,
    exchangeForLongLivedToken
};
