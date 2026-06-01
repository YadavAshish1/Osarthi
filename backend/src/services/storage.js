import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localUploadDir = path.join(__dirname, '../../uploads');

let cloudinaryReady = false;

function env(name) {
  return process.env[name]?.trim() || '';
}

export function isCloudinaryEnabled() {
  if (env('CLOUDINARY_ENABLED') === 'false') return false;
  if (env('CLOUDINARY_URL')) return true;

  const secret = env('CLOUDINARY_API_SECRET');
  if (!secret || secret.includes('*')) return false;

  return !!(env('CLOUDINARY_CLOUD_NAME') && env('CLOUDINARY_API_KEY') && secret);
}

function ensureCloudinary() {
  if (cloudinaryReady) return;

  const url = env('CLOUDINARY_URL');
  if (url) {
    process.env.CLOUDINARY_URL = url;
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: env('CLOUDINARY_CLOUD_NAME'),
      api_key: env('CLOUDINARY_API_KEY'),
      api_secret: env('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  cloudinaryReady = true;
}

function getResourceType(mimetype) {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('image/')) return 'image';
  return 'raw';
}

function getTypePrefix(mimetype) {
  if (mimetype.startsWith('video/')) return 'V';
  if (mimetype.startsWith('image/')) return 'I';
  return 'F';
}

function guessExtension(originalName, mimetype) {
  const fromName = path.extname(originalName).toLowerCase();
  if (fromName) return fromName;
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'application/pdf': '.pdf',
  };
  return map[mimetype] || '';
}

/**
 * I-{userId}-{datetime}-{timestamp}.ext
 * e.g. I-674a1b2c3d4e5f678901234-2026-06-01T14-30-45-1780335693291.jpg
 */
export function buildMediaFilename(userId, originalName, mimetype) {
  if (!userId) {
    throw new Error('userId is required for media upload');
  }

  const ext = guessExtension(originalName, mimetype);
  const prefix = getTypePrefix(mimetype);
  const safeUserId = String(userId).replace(/[^a-zA-Z0-9]/g, '');
  const datetime = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const timestamp = Date.now();
  const basename = `${prefix}-${safeUserId}-${datetime}-${timestamp}`;
  const filename = `${basename}${ext}`;

  return { basename, ext, filename, prefix };
}

async function uploadToCloudinary(file, userId) {
  ensureCloudinary();

  const secret = env('CLOUDINARY_API_SECRET');
  if (!env('CLOUDINARY_URL') && (!secret || secret.includes('*'))) {
    throw new Error(
      'Cloudinary API secret is missing or invalid. In .env set CLOUDINARY_URL (recommended) or CLOUDINARY_API_SECRET from the dashboard.'
    );
  }

  const { basename, filename } = buildMediaFilename(userId, file.originalname, file.mimetype);
  const resourceType = getResourceType(file.mimetype);
  const folder = env('CLOUDINARY_FOLDER') || 'osarthi';
  const publicId = `${folder}/${basename}`;

  const options = {
    public_id: publicId,
    resource_type: resourceType,
    unique_filename: false,
    overwrite: false,
    use_filename: false,
  };

  const useStream = file.buffer.length > 12 * 1024 * 1024 && resourceType === 'video';

  let result;
  if (useStream) {
    result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, uploadResult) => {
        if (error) reject(error);
        else resolve(uploadResult);
      });
      stream.end(file.buffer);
    });
  } else {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    result = await cloudinary.uploader.upload(dataUri, options);
  }

  return {
    url: result.secure_url,
    key: result.public_id,
    filename,
    mimetype: file.mimetype,
    storage: 'cloudinary',
    width: result.width,
    height: result.height,
  };
}

async function uploadToLocal(file, userId) {
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }

  const { filename } = buildMediaFilename(userId, file.originalname, file.mimetype);
  const filepath = path.join(localUploadDir, filename);
  await fs.promises.writeFile(filepath, file.buffer);

  return {
    url: `/uploads/${filename}`,
    key: filename,
    filename,
    mimetype: file.mimetype,
    storage: 'local',
  };
}

/**
 * Upload image/video/PDF from multer memory buffer.
 * Filename: I-{userId}-{datetime}-{timestamp}.ext (V- for video, F- for other)
 */
export async function uploadMedia(file, { userId } = {}) {
  if (!file?.buffer) {
    throw new Error('Invalid file buffer');
  }
  if (!userId) {
    throw new Error('userId is required for media upload');
  }

  if (isCloudinaryEnabled()) {
    return uploadToCloudinary(file, userId);
  }
  return uploadToLocal(file, userId);
}

export function getStorageMode() {
  return isCloudinaryEnabled() ? 'cloudinary' : 'local';
}
