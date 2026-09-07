const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, default: "General" },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  status: { type: String, enum: ["Pending", "Assigned", "In Progress", "Resolved", "Rejected"], default: "Pending" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Legacy/local image path. Kept for older complaints.
  image: { type: String, default: "" },

  // Persistent evidence storage in MongoDB for new uploads. This avoids
  // Render's ephemeral filesystem, so evidence remains available after deploys.
  imageData: { type: Buffer, default: null },
  imageContentType: { type: String, default: "" },

  assignedMembers: { type: [String], default: [] },
  remarks: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);
