const multer = require("multer");
const fs = require("fs");
const path = require("path");

// =====================================================
// DEFAULT UPLOAD
// Existing Davine functionality
// =====================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(
      new Error("Only PDF files are allowed"),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
});


// =====================================================
// INTERN PORTAL / WEEKLY CONTENT UPLOADER
// =====================================================

const makeUploader = (folderName) => {

  const uploadFolder = path.join(
    __dirname,
    "..",
    "uploads",
    folderName
  );

  // Create folder automatically
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, {
      recursive: true
    });
  }

  const storage = multer.diskStorage({

    destination: function (req, file, cb) {
      cb(null, uploadFolder);
    },

    filename: function (req, file, cb) {
      cb(
        null,
        Date.now() + "-" + file.originalname
      );
    },

  });

  const fileFilter = (req, file, cb) => {

    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(
        new Error("Only PDF files are allowed"),
        false
      );
    }

  };

  return multer({
    storage,
    fileFilter
  });
};


// =====================================================
// CONVERT UPLOAD PATH TO PUBLIC URL
// =====================================================

const toPublicUrl = (folderName, filename) => {

  return `/uploads/${folderName}/${filename}`;

};


// =====================================================
// EXPORT
// =====================================================

// Existing:
// const upload = require("../middleware/uploadMiddleware");

// New Intern Portal:
// const { makeUploader, toPublicUrl } =
// require("../middleware/uploadMiddleware");

module.exports = upload;

module.exports.makeUploader = makeUploader;
module.exports.toPublicUrl = toPublicUrl;