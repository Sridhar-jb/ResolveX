const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorName: { type: String, default: "System" },
    actorRole: { type: String, default: "system" },
    action: { type: String, required: true, trim: true },
    entity: { type: String, default: "" },
    entityId: { type: String, default: "" },
    detail: { type: String, default: "" },
    ip: { type: String, default: "" },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
