const mongoose = require("mongoose");
const { STATUSES, PRIORITIES } = require("../config/constants");

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    note: { type: String, default: "" },
    byName: { type: String, default: "ResolveX" },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    category: { type: String, default: "Other", trim: true },
    priority: { type: String, enum: PRIORITIES, default: "Medium" },
    status: { type: String, enum: STATUSES, default: "Pending", index: true },
    location: { type: String, default: "", trim: true, maxlength: 160 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Evidence is stored in MongoDB so it survives ephemeral hosting filesystems.
    imageData: { type: Buffer, default: null, select: false },
    imageContentType: { type: String, default: "" },
    imageName: { type: String, default: "" },

    assignedMembers: { type: [String], default: [] },
    remarks: { type: String, default: "" },
    routingReason: { type: String, default: "" },
    resolvedAt: { type: Date, default: null },
    timeline: { type: [timelineSchema], default: [] },
  },
  { timestamps: true }
);

complaintSchema.index({ title: "text", description: "text" });

complaintSchema.pre("validate", async function assignReference(next) {
  if (this.reference) return next();
  const count = await this.constructor.estimatedDocumentCount();
  const suffix = String(count + 1).padStart(3, "0");
  this.reference = `RX-${suffix}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
  next();
});

complaintSchema.virtual("hasEvidence").get(function hasEvidence() {
  return Boolean(this.imageContentType);
});

complaintSchema.set("toJSON", { virtuals: true });
complaintSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Complaint", complaintSchema);
