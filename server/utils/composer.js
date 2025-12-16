const axios = require('axios');
const sharp = require('sharp');
const stream = require('stream');
const { uploadStream } = require('./cloudinary');

async function composeAndUpload(baseUrl, footerUrl, options = {}) {
    // options can include width/height
    const width = options.width || 1080;
    const height = options.height || 1080;

    const [baseResp, footerResp] = await Promise.all([
        axios.get(baseUrl, { responseType: 'arraybuffer' }),
        axios.get(footerUrl, { responseType: 'arraybuffer' })
    ]);

    const baseBuffer = Buffer.from(baseResp.data);
    const footerBuffer = Buffer.from(footerResp.data);

    const baseSharp = sharp(baseBuffer).resize(width, height, { fit: 'cover' }).png();
    const footerResized = await sharp(footerBuffer).resize({ width }).png().toBuffer();

    const composedBuffer = await baseSharp
        .composite([{ input: footerResized, gravity: 'south' }])
        .toBuffer();

    const pass = new stream.PassThrough();
    pass.end(composedBuffer);
    const result = await uploadStream(pass, { folder: 'composed' });
    return result; // contains secure_url, public_id, etc.
}

module.exports = { composeAndUpload };
