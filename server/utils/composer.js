const axios = require('axios');
const sharp = require('sharp');
const stream = require('stream');
const { uploadStream } = require('./cloudinary');

/**
 * Compose a professional poster-style image
 * Festival image takes up most of the space (75%)
 * Footer section (25%) with white/colored background contains profile branding
 * 
 * @param {string} baseUrl - Festival image URL
 * @param {string} footerUrl - User's profile/logo image URL
 * @param {Object} options - Composition options
 * @returns {Promise<Object>} Cloudinary upload result
 */
async function composeAndUpload(baseUrl, footerUrl, options = {}) {
    const finalWidth = options.width || 1080;
    const finalHeight = options.height || 1080;
    
    // Calculate heights: 75% festival image, 25% footer section
    const festivalHeight = Math.floor(finalHeight * 0.75); // 810px for 1080x1080
    const footerHeight = finalHeight - festivalHeight;      // 270px for 1080x1080
    
    // Footer styling options
    const footerBgColor = options.footerBgColor || '#FFFFFF'; // White background
    const profileImageSize = Math.floor(footerHeight * 0.6); // Profile image 60% of footer height
    const padding = Math.floor(footerHeight * 0.1); // 10% padding

    try {
        // Download both images
        const [baseResp, footerResp] = await Promise.all([
            axios.get(baseUrl, { responseType: 'arraybuffer' }),
            axios.get(footerUrl, { responseType: 'arraybuffer' })
        ]);

        const baseBuffer = Buffer.from(baseResp.data);
        const footerBuffer = Buffer.from(footerResp.data);

        // Step 1: Resize festival image to top 75% area
        const festivalImage = await sharp(baseBuffer)
            .resize(finalWidth, festivalHeight, { 
                fit: 'cover',
                position: 'center'
            })
            .toBuffer();

        // Step 2: Create footer section with white background
        const footerSection = await sharp({
            create: {
                width: finalWidth,
                height: footerHeight,
                channels: 4,
                background: footerBgColor
            }
        })
        .png()
        .toBuffer();

        // Step 3: Process profile image - circular with border
        const profileImage = await sharp(footerBuffer)
            .resize(profileImageSize, profileImageSize, { 
                fit: 'cover',
                position: 'center'
            })
            .composite([{
                input: Buffer.from(
                    `<svg width="${profileImageSize}" height="${profileImageSize}">
                        <circle cx="${profileImageSize/2}" cy="${profileImageSize/2}" r="${profileImageSize/2}" fill="white"/>
                    </svg>`
                ),
                blend: 'dest-in'
            }])
            .toBuffer();

        // Step 4: Add profile image to footer section (centered)
        const footerWithProfile = await sharp(footerSection)
            .composite([{
                input: profileImage,
                top: Math.floor((footerHeight - profileImageSize) / 2),
                left: Math.floor((finalWidth - profileImageSize) / 2)
            }])
            .toBuffer();

        // Step 5: Combine festival image with footer section
        const finalComposition = await sharp(festivalImage)
            .extend({
                bottom: footerHeight,
                background: footerBgColor
            })
            .composite([{
                input: footerWithProfile,
                top: festivalHeight,
                left: 0
            }])
            .png()
            .toBuffer();

        // Step 6: Upload to Cloudinary
        const pass = new stream.PassThrough();
        pass.end(finalComposition);
        const result = await uploadStream(pass, { 
            folder: 'composed',
            format: 'png',
            quality: 90
        });
        
        return result;
    } catch (error) {
        console.error('❌ Image composition error:', error);
        throw error;
    }
}

module.exports = { composeAndUpload };
