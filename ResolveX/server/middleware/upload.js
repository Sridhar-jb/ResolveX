const multer = require("multer");
const ApiError = require("../utils/ApiError");

// Evidence is kept in memory and written to MongoDB by the controller.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true);
    return cb(new ApiError(400, "Evidence must be an image file."));
  },
});

module.exports = upload;
