const multer = require("multer");
const path = require("path");

const whitelist = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

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

const upload = multer({
   storage: storage,
   fileFilter: function (req, file, cb) {
      if (!whitelist.includes(file.mimetype)) {
         req.fileError = true;
         cb(null, false);
      }
      cb(null, true);
   },
});

module.exports = upload;
