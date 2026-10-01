const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    siteName: { type: String, default: "ResolveX" },
    tagline: { type: String, default: "Report. Track. Resolve. Together." },
    autoAssign: { type: Boolean, default: true },
    aiAssistant: { type: Boolean, default: true },
    allowRegistration: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maxUploadMb: { type: Number, default: 10, min: 1, max: 15 },
    defaultPriority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    resolutionTargetHours: { type: Number, default: 48, min: 1, max: 720 },
  },
  { timestamps: true }
);

settingSchema.statics.current = async function current() {
  let doc = await this.findOne({ key: "global" });
  if (!doc) doc = await this.create({ key: "global" });
  return doc;
};

module.exports = mongoose.model("Setting", settingSchema);
