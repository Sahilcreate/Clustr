const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type."), false);
  }
};

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const base = path.basename(file.originalname, ext);
//     const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, base + "-" + unique + ext);
//   },
// });

const storage = multer.memoryStorage();

const limits = {
  fileSize: 10 * 1024 * 1024, //10MB
};

const upload = multer({
  storage,
  fileFilter,
  limits,
});

module.exports = {
  upload,
};
