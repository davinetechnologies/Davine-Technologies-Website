const multer = require("multer");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");

// =====================================================
// S3 STORAGE
// =====================================================

const storage = multer.memoryStorage();

// =====================================================
// PDF FILTER
// =====================================================

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// =====================================================
// UPLOADER
// =====================================================

const makeUploader = (folderName) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
    },
  });
};

// =====================================================
// UPLOAD FILE TO S3
// =====================================================

const uploadToS3 = async (file, folderName) => {
  if (!file) {
    return null;
  }

  const safeName = file.originalname.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );

  const key = `${folderName}/${Date.now()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return {
    key,
    url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    originalName: file.originalname,
  };
};

// =====================================================
// PUBLIC URL HELPER
// =====================================================

const toPublicUrl = (folderName, filename) => {
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${folderName}/${filename}`;
};

// =====================================================
// EXPORT
// =====================================================

module.exports = upload;

module.exports.makeUploader = makeUploader;
module.exports.uploadToS3 = uploadToS3;
module.exports.toPublicUrl = toPublicUrl;