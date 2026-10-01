const mongoose = require("mongoose");
const { USER_ROLES } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: "user" },
    phone: { type: String, default: "", trim: true },
    department: { type: String, default: "", trim: true },
    avatarColor: { type: String, default: "#6366f1" },
    preferences: {
      theme: { type: String, enum: ["light", "dark", "system"], default: "dark" },
      emailUpdates: { type: Boolean, default: true },
      pushUpdates: { type: Boolean, default: true },
    },
    lastLoginAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    department: this.department,
    avatarColor: this.avatarColor,
    preferences: this.preferences,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt,
    isActive: this.isActive,
  };
};

module.exports = mongoose.model("User", userSchema);
