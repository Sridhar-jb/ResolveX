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

// Get all complaints
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// Assign complaint to up to 5 members
const assignComplaint = async (req, res) => {
  try {
    const { assignedMembers } = req.body;
    if (!Array.isArray(assignedMembers) || assignedMembers.length === 0) return res.status(400).json({ success:false, message:"Select at least one member" });
    if (assignedMembers.length > 5) return res.status(400).json({ success:false, message:"Maximum 5 members can be assigned" });
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success:false, message:"Complaint not found" });
    complaint.assignedMembers = [...new Set(assignedMembers.map(String))];
    complaint.status = "Assigned";
    await complaint.save();
    res.json({ success:true, message:`Complaint assigned to ${complaint.assignedMembers.length} members`, complaint });
  } catch (error) { res.status(500).json({success:false,message:error.message}); }
};


const autoAssign = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
    const routing = await autoAssignComplaint(complaint);
    complaint.category = routing.category;
    complaint.priority = routing.priority;
    complaint.assignedMembers = routing.assignedMembers;
    complaint.status = "Assigned";
    complaint.remarks = `AI auto-routing: ${routing.reason}`;
    await complaint.save();
    res.json({ success: true, message: "AI assigned the complaint automatically", routing, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update status
const updateStatus = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    complaint.status = req.body.status;
    complaint.remarks = req.body.remarks || "";

    await complaint.save();

    res.json({
      success: true,
      message: "Status Updated Successfully",
      complaint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin can delete any complaint, regardless of who filed it
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
    removeImageFile(complaint.image);
    await complaint.deleteOne();
    res.json({ success: true, message: "Complaint Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllComplaints,
  assignComplaint,
  autoAssign,
  updateStatus,
  deleteComplaint,
};