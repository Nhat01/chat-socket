const multer = require("multer");
const path = require("path");

const whitelistImage = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const whitelistFile = [
   "image/jpeg",
   "image/png",
   "image/gif",
   "application/pdf",
   "application/msword",
   "application/vnd.ms-excel",
   "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
   "text/plain",
];

const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "./public/images"));
   },
   filename: function (req, file, cb) {
      const name = Date.now() + "-" + file.originalname;
      req.filename = name;
      cb(null, name);
   },
});

const storageFile = multer.diskStorage({
   destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "./public/fileUploads"));
   },
   filename: function (req, file, cb) {
      const name = Date.now() + "-" + file.originalname;
      req.filename = name;
      req.fileExtension = path.extname(file.originalname);
      cb(null, name);
   },
});

const upload = multer({
   storage: storage,
   fileFilter: function (req, file, cb) {
      if (!whitelistImage.includes(file.mimetype)) {
         req.fileError = true;
         cb(null, false);
      }
      cb(null, true);
   },
});

const uploadFile = multer({
   storage: storageFile,
   fileFilter: function (req, file, cb) {
      if (!whitelistFile.includes(file.mimetype)) {
         req.fileError = true;
         cb(null, false);
      }
      cb(null, true);
   },
});

module.exports = { upload, uploadFile };
