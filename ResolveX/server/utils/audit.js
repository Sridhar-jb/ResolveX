const AuditLog = require("../models/AuditLog");

// Audit writes never block the request they describe.
const recordAudit = async (req, { action, entity = "", entityId = "", detail = "" }) => {
  try {
    await AuditLog.create({
      actor: req?.user?.id || null,
      actorName: req?.user?.name || "System",
      actorRole: req?.user?.role || "system",
      action,
      entity,
      entityId: String(entityId || ""),
      detail,
      ip: req?.ip || "",
    });
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
};

module.exports = { recordAudit };
