const axios = require('axios');
const sharp = require('sharp');
const stream = require('stream');
const { uploadStream } = require('./cloudinary');

/**
 * Compose a professional poster-style image optimized for Instagram
 * Festival image takes up most of the space (80%)
 * Footer section (20%) uses bottom-anchored crop to preserve key footer content
 * If footer aspect ratio does not match target slot, crop from bottom to fit
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
    const festivalHeight = Math.floor(finalHeight * 0.80);
    const footerHeight = finalHeight - festivalHeight;
    const seamBlendHeight = Math.max(12, Math.floor(finalHeight * 0.012));

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

        // Step 2: Normalize footer to exact slot using bottom-anchored crop.
        // This keeps the lower part of uploaded footer, which typically contains logos/text.
        const processedFooter = await sharp(footerBuffer)
            .resize(finalWidth, footerHeight, {
                fit: 'cover',
                position: 'south'
            })
            .toBuffer();

        // Step 3: Combine festival image with footer
        let finalComposition = await sharp(festivalImage)
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

        // Step 4: Add subtle seam blend so festival and footer join more naturally.
        const seamOverlaySvg = Buffer.from(`
            <svg width="${finalWidth}" height="${seamBlendHeight}" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="seam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#000000" stop-opacity="0.14" />
                  <stop offset="100%" stop-color="#000000" stop-opacity="0" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="100%" height="100%" fill="url(#seam)" />
            </svg>
        `);

        finalComposition = await sharp(finalComposition)
            .composite([{
                input: seamOverlaySvg,
                top: Math.max(0, festivalHeight - Math.floor(seamBlendHeight / 2)),
                left: 0
            }])
            .png()
            .toBuffer();

        // Step 5: Upload to Cloudinary
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
