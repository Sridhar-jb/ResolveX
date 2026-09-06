const fs = require("fs");
const path = require("path");
const Complaint = require("../models/Complaint");
const { autoAssignComplaint } = require("../services/aiService");

const removeImageFile = (imagePath) => {
  if (!imagePath) return;

  // Only allow deleting files from our own uploads directory.
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
    const complaint = await Complaint.create({
      title,
      description,
      category: routing.category,
      priority: routing.priority,
      status: routing.assignedMembers.length ? "Assigned" : "Pending",
      assignedMembers: routing.assignedMembers,
      image: req.file ? `/uploads/${req.file.filename}` : "",
      user: req.user.id,
      remarks: `AI auto-routing: ${routing.reason}`,
    });
    res.status(201).json({ success: true, message: "Complaint submitted and automatically routed", complaint, routing });
  } catch (error) {
    console.error("CREATE COMPLAINT ERROR:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to submit complaint" });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: complaints.length, complaints });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
    if (complaint.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You can only view your own complaints" });
    }
    res.json({ success: true, complaint });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
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
      complaint.image = `/uploads/${req.file.filename}`;
    }
    await complaint.save();
    res.json({ success: true, message: "Complaint Updated Successfully", complaint });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// Used by the complainant to delete one of their own complaints.
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

module.exports = { createComplaint, getMyComplaints, getComplaintById, updateComplaint, deleteComplaint };
