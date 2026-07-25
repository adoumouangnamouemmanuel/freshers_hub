const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../public/uploads/clubs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: multerFilter,
});

exports.uploadImageMulter = upload.single('image');

exports.processAndSaveImage = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  const { type } = req.body; // 'logo' or 'cover'
  
  const ext = 'webp';
  const filename = `club-${type || 'image'}-${Date.now()}.${ext}`;
  const filepath = path.join(uploadDir, filename);

  let sharpInstance = sharp(req.file.buffer);

  if (type === 'logo') {
    sharpInstance = sharpInstance.resize(400, 400, { fit: 'cover' });
  } else if (type === 'cover') {
    sharpInstance = sharpInstance.resize(1200, 400, { fit: 'cover' });
  } else {
    // Default fallback
    sharpInstance = sharpInstance.resize({ width: 1200, withoutEnlargement: true });
  }

  await sharpInstance
    .toFormat('webp', { quality: 85 })
    .toFile(filepath);

  // Store a relative path so both web and mobile can prefix with their own API base URL.
  // e.g. mobile uses http://10.x.x.x:4000, web uses http://localhost:4000 — both work.
  const relativePath = `/uploads/clubs/${filename}`;

  // Also return a full URL usable by the caller (web dashboard) for immediate preview
  const baseUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const url = `${baseUrl}${relativePath}`;

  res.status(200).json({
    success: true,
    url,           // absolute URL for immediate web preview
    path: relativePath, // relative path to store in DB
  });
});
