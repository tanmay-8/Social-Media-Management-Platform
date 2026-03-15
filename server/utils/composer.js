const axios = require('axios');
const sharp = require('sharp');
const stream = require('stream');
const { uploadStream } = require('./cloudinary');

/**
 * Compose a professional poster-style image optimized for Instagram
 * Festival image fills the full canvas
 * Footer width is matched to the festival image width without cropping
 * Final output: 1080x1350 (4:5 aspect ratio - Instagram portrait optimal)
 * 
 * @param {string} baseUrl - Festival image URL
 * @param {string} footerUrl - User's footer/branding image URL
 * @param {Object} options - Composition options
 * @returns {Promise<Object>} Cloudinary upload result
 */
async function composeAndUpload(baseUrl, footerUrl, options = {}) {
    // Instagram optimal sizes: 1080x1350 (4:5 portrait) - most feed real estate
    const finalWidth = options.width || 1080;
    const finalHeight = options.height || 1350;

    try {
        // Download both images
        const [baseResp, footerResp] = await Promise.all([
            axios.get(baseUrl, { responseType: 'arraybuffer' }),
            axios.get(footerUrl, { responseType: 'arraybuffer' })
        ]);

        const baseBuffer = Buffer.from(baseResp.data);
        const footerBuffer = Buffer.from(footerResp.data);

        // Step 1: Resize festival image to full final canvas.
        const festivalImage = await sharp(baseBuffer)
            .resize(finalWidth, finalHeight, { 
                fit: 'cover',
                position: 'center'
            })
            .toBuffer();

        // Step 2: Match footer width to final image width without cropping.
        // Height is capped at 20% of the final canvas height.
        const maxFooterHeight = Math.floor(finalHeight * 0.20);
        const processedFooter = await sharp(footerBuffer)
            .resize({
                width: finalWidth,
                height: maxFooterHeight,
                fit: 'inside'   // scale down to fit within width×maxFooterHeight, never upscale beyond width
            })
            .png()
            .toBuffer();

        const footerMetadata = await sharp(processedFooter).metadata();
        const footerVisibleHeight = Math.min(footerMetadata.height || 0, finalHeight);
        const footerTop = Math.max(0, finalHeight - footerVisibleHeight);

        // Step 3: Overlay footer on top of festival image at the bottom.
        let finalComposition = await sharp(festivalImage)
            .composite([{
                input: processedFooter,
                gravity: 'south'
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
