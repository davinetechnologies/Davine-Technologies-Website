const multer = require("multer");
const {
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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

// =====================================================
// DEFAULT UPLOAD
// =====================================================

const upload = multer({
  storage,
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
      fileSize: 10 * 1024 * 1024,
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
    originalName: file.originalname,
  };
};

// =====================================================
// GENERATE PRIVATE S3 PRESIGNED URL
// =====================================================

const getPresignedUrl = async (key) => {
  if (!key) {
    return null;
  }

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ResponseContentType: "application/pdf",
    ResponseContentDisposition: "inline",
  });

  const signedUrl = await getSignedUrl(s3, command, {
    expiresIn: 3600, // 1 hour
  });

  return signedUrl;
};

// =====================================================
// EXPORT
// =====================================================

module.exports = upload;

module.exports.makeUploader = makeUploader;
module.exports.uploadToS3 = uploadToS3;
module.exports.getPresignedUrl = getPresignedUrl;