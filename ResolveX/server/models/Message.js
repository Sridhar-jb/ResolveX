const mongoose = require("mongoose");

// One thread per customer. `user` is the customer the thread belongs to,
// `sender` is whoever wrote the message.
const messageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    senderRole: { type: String, enum: ["user", "admin", "ai"], required: true },
    senderName: { type: String, default: "" },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readByUser: { type: Boolean, default: false },
    readByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ user: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
