const mongoose = require("mongoose");

// `user: null` marks a notification for the whole admin desk.
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    audience: { type: String, enum: ["user", "admin"], default: "user", index: true },
    kind: {
      type: String,
      enum: ["complaint", "status", "assignment", "message", "system", "account"],
      default: "system",
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, default: "", trim: true, maxlength: 400 },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
