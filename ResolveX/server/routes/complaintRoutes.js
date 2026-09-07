const express = require("express");
const multer = require("multer");

const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
} = require("../controllers/complaintController");

// Keep uploads in memory and save them in MongoDB. Render's local filesystem
// is ephemeral, which caused previously uploaded evidence to disappear.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
  // MongoDB documents have a 16 MB limit. 10 MB leaves room for complaint data
  // and base64/UI overhead while still allowing normal evidence photos.
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/", protect, upload.single("image"), createComplaint);
router.get("/", protect, getMyComplaints);
router.get("/:id", protect, getComplaintById);
router.put("/:id", protect, upload.single("image"), updateComplaint);
router.delete("/:id", protect, deleteComplaint);

module.exports = router;
