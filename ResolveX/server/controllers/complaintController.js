const fs = require("fs");
const path = require("path");
const Complaint = require("../models/Complaint");
const { autoAssignComplaint } = require("../services/aiService");

const removeImageFile = (imagePath) => {
  if (!imagePath || !String(imagePath).startsWith("/uploads/")) return;

  const filename = path.basename(String(imagePath));
  const filePath = path.join(__dirname, "..", "uploads", filename);

  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Failed to remove image file:", err.message);
    }
  });
};

const createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body || {};
    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: "Title, description and category are required" });
    }

    const routing = await autoAssignComplaint({ title, description, category, priority });

    const complaintData = {
      title,
      description,
      category: routing.category,
      priority: routing.priority,
      status: routing.assignedMembers.length ? "Assigned" : "Pending",
      assignedMembers: routing.assignedMembers,
      user: req.user.id,
      remarks: `AI auto-routing: ${routing.reason}`,
    };

    if (req.file) {
      complaintData.imageData = req.file.buffer;
      complaintData.imageContentType = req.file.mimetype;
      complaintData.image = "";
    }

    const complaint = await Complaint.create(complaintData);

    res.status(201).json({ success: true, message: "Complaint submitted and automatically routed", complaint, routing });
  } catch (error) {
    console.error("CREATE COMPLAINT ERROR:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to submit complaint" });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user.id })
      .select("-imageData")
      .sort({ createdAt: -1 });
    res.json({ success: true, count: complaints.length, complaints });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate("user", "name email");
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    // Admin can read every complaint. Normal users can read only their own.
    const ownerId = complaint.user?._id?.toString() || complaint.user?.toString();
    if (ownerId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You can only view your own complaints" });
    }

    const result = complaint.toObject();
    if (result.imageData) {
      // Mongoose may expose a Buffer as a Node Buffer, BSON Binary, or a
      // serialized { type: "Buffer", data: [...] } object depending on how
      // the document was materialized. Normalize all supported forms before
      // creating the browser-safe data URL.
      let buffer;
      if (Buffer.isBuffer(result.imageData)) {
        buffer = result.imageData;
      } else if (result.imageData?.buffer && Buffer.isBuffer(result.imageData.buffer)) {
        buffer = result.imageData.buffer;
      } else if (result.imageData?.data && Array.isArray(result.imageData.data)) {
        buffer = Buffer.from(result.imageData.data);
      } else if (result.imageData?.value && Array.isArray(result.imageData.value)) {
        buffer = Buffer.from(result.imageData.value);
      } else {
        buffer = Buffer.from(result.imageData);
      }

      result.image = `data:${result.imageContentType || "image/jpeg"};base64,${buffer.toString("base64")}`;
    }
    delete result.imageData;

    res.json({ success: true, complaint: result });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};


const getComplaintEvidence = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).select("user image imageData imageContentType");
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    const ownerId = complaint.user?.toString();
    if (ownerId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You can only view your own complaint evidence" });
    }

    // New uploads are persisted directly in MongoDB. Normalize BSON/Mongoose
    // binary representations before sending bytes to the browser.
    if (complaint.imageData && complaint.imageContentType) {
      let buffer;
      if (Buffer.isBuffer(complaint.imageData)) {
        buffer = complaint.imageData;
      } else if (complaint.imageData?.buffer && Buffer.isBuffer(complaint.imageData.buffer)) {
        buffer = complaint.imageData.buffer;
      } else if (complaint.imageData?.data && Array.isArray(complaint.imageData.data)) {
        buffer = Buffer.from(complaint.imageData.data);
      } else if (complaint.imageData?.value && Array.isArray(complaint.imageData.value)) {
        buffer = Buffer.from(complaint.imageData.value);
      } else {
        buffer = Buffer.from(complaint.imageData);
      }

      res.set({
        "Content-Type": complaint.imageContentType,
        "Content-Length": String(buffer.length),
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      });
      return res.end(buffer);
    }

    // Backward-compatible support for older local /uploads files.
    if (complaint.image && String(complaint.image).startsWith("/uploads/")) {
      const filename = path.basename(String(complaint.image));
      const filePath = path.join(__dirname, "..", "uploads", filename);
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }

    return res.status(404).json({ success: false, message: "Evidence image is no longer available" });
  } catch (error) {
    console.error("GET EVIDENCE ERROR:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to load evidence" });
  }
};

const updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
    if (complaint.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You can only edit your own complaints" });
    }

    complaint.title = req.body?.title || complaint.title;
    complaint.description = req.body?.description || complaint.description;
    complaint.category = req.body?.category || complaint.category;
    complaint.priority = req.body?.priority || complaint.priority;

    if (req.file) {
      removeImageFile(complaint.image);
      complaint.image = "";
      complaint.imageData = req.file.buffer;
      complaint.imageContentType = req.file.mimetype;
    }

    await complaint.save();
    res.json({ success: true, message: "Complaint Updated Successfully", complaint });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
    if (complaint.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You can only delete your own complaints" });
    }
    removeImageFile(complaint.image);
    await complaint.deleteOne();
    res.json({ success: true, message: "Complaint Deleted Successfully" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { createComplaint, getMyComplaints, getComplaintById, getComplaintEvidence, updateComplaint, deleteComplaint };
