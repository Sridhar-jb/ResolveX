const mongoose = require("mongoose");

// Every message belongs to a single "conversation" between one customer
// (the `user` field) and the support/admin side. `sender` is whoever
// actually wrote the message and `senderRole` says which side that was.
const messageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["user", "admin"], required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readByUser: { type: Boolean, default: false },
    readByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ user: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
