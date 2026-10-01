const mongoose = require("mongoose");
const Setting = require("../models/Setting");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Message = require("../models/Message");
const asyncHandler = require("../utils/asyncHandler");
const { recordAudit } = require("../utils/audit");

const EDITABLE = [
  "siteName",
  "tagline",
  "autoAssign",
  "aiAssistant",
  "allowRegistration",
  "emailNotifications",
  "maintenanceMode",
  "maxUploadMb",
  "defaultPriority",
  "resolutionTargetHours",
];

const get = asyncHandler(async (_req, res) => {
  const settings = await Setting.current();
  res.json({ success: true, settings });
});

const update = asyncHandler(async (req, res) => {
  const settings = await Setting.current();

  EDITABLE.forEach((key) => {
    if (req.body?.[key] !== undefined) settings[key] = req.body[key];
  });

  await settings.save();
  await recordAudit(req, { action: "System settings updated", entity: "Setting", entityId: settings._id });

  res.json({ success: true, message: "Settings saved.", settings });
});

// Powers the "System status" panel on the admin dashboard.
const health = asyncHandler(async (_req, res) => {
  const dbState = mongoose.connection.readyState === 1;
  const [complaints, users, messages] = await Promise.all([
    Complaint.estimatedDocumentCount(),
    User.estimatedDocumentCount(),
    Message.estimatedDocumentCount(),
  ]);
  const settings = await Setting.current();

  res.json({
    success: true,
    health: {
      services: [
        { name: "Database", status: dbState ? "Online" : "Offline" },
        { name: "API services", status: "Online" },
        { name: "AI assistant", status: settings.aiAssistant ? "Online" : "Paused" },
        { name: "File storage", status: dbState ? "Online" : "Offline" },
      ],
      records: { complaints, users, messages },
      uptimeSeconds: Math.floor(process.uptime()),
      maintenanceMode: settings.maintenanceMode,
    },
  });
});

module.exports = { get, update, health };
