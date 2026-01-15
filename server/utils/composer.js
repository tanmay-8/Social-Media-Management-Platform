const axios = require('axios');
const sharp = require('sharp');
const stream = require('stream');
const { uploadStream } = require('./cloudinary');

/**
 * Compose a professional poster-style image optimized for Instagram
 * Festival image takes up most of the space (80%)
 * Footer section (20%) contains the footer image stretched horizontally
 * If footer image is not horizontal, it will be converted/adapted to fit
 * Final output: 1080x1350 (4:5 aspect ratio - Instagram portrait optimal)
 * 
 * @param {string} baseUrl - Festival image URL
 * @param {string} footerUrl - User's footer/branding image URL (will be made horizontal)
 * @param {Object} options - Composition options
 * @returns {Promise<Object>} Cloudinary upload result
 */
async function composeAndUpload(baseUrl, footerUrl, options = {}) {
    // Instagram optimal sizes: 1080x1350 (4:5 portrait) - most feed real estate
    const finalWidth = options.width || 1080;
    const finalHeight = options.height || 1350; // Changed from 1080 to 1350 for Instagram 4:5 ratio
    
    // Calculate heights: 80% festival image, 20% footer section
    const festivalHeight = Math.floor(finalHeight * 0.80); // 1080px for 1350 total
    const footerHeight = finalHeight - festivalHeight;      // 270px for footer

    try {
        // Download both images
        const [baseResp, footerResp] = await Promise.all([
            axios.get(baseUrl, { responseType: 'arraybuffer' }),
            axios.get(footerUrl, { responseType: 'arraybuffer' })
        ]);

        const baseBuffer = Buffer.from(baseResp.data);
        const footerBuffer = Buffer.from(footerResp.data);

        // Step 1: Resize festival image to top 80% area
        const festivalImage = await sharp(baseBuffer)
            .resize(finalWidth, festivalHeight, { 
                fit: 'cover',
                position: 'center'
            })
            .toBuffer();

        // Step 2: Get footer image metadata to check aspect ratio
        const footerMetadata = await sharp(footerBuffer).metadata();
        const footerAspectRatio = footerMetadata.width / footerMetadata.height;
        const targetAspectRatio = finalWidth / footerHeight; // Target horizontal ratio (4:1 for 1080x270)

        let processedFooter;

        // If footer is already horizontal-ish (aspect ratio > 1.5), stretch it to fit
        if (footerAspectRatio >= 1.5) {
            // Footer is already horizontal, just resize to fit the footer area
            processedFooter = await sharp(footerBuffer)
                .resize(finalWidth, footerHeight, {
                    fit: 'fill', // Stretch to fill
                    position: 'center'
                })
                .toBuffer();
        } else {
            // Footer is square/vertical, need to make it horizontal
            // Strategy: Place the image centered on a white/colored background
            const footerBgColor = options.footerBgColor || '#FFFFFF';
            
            // Scale the footer image to fit within the footer height while maintaining aspect ratio
            const scaledFooterHeight = Math.floor(footerHeight * 0.85); // Use 85% of height for padding
            const scaledFooterWidth = Math.floor(scaledFooterHeight * footerAspectRatio);
            
            const scaledFooter = await sharp(footerBuffer)
                .resize(scaledFooterWidth, scaledFooterHeight, {
                    fit: 'contain',
                    position: 'center'
                })
                .toBuffer();

            // Create white background and place footer image centered
            processedFooter = await sharp({
                create: {
                    width: finalWidth,
                    height: footerHeight,
                    channels: 4,
                    background: footerBgColor
                }
            })
            .composite([{
                input: scaledFooter,
                top: Math.floor((footerHeight - scaledFooterHeight) / 2),
                left: Math.floor((finalWidth - scaledFooterWidth) / 2)
            }])
            .png()
            .toBuffer();
        }

        // Step 3: Combine festival image with footer
        const finalComposition = await sharp(festivalImage)
            .extend({
                bottom: footerHeight,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .composite([{
                input: processedFooter,
                top: festivalHeight,
                left: 0
            }])
            .png()
            .toBuffer();

        // Step 4: Upload to Cloudinary
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
