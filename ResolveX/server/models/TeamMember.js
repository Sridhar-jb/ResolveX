const mongoose = require("mongoose");
const { TEAM_ROLES } = require("../config/constants");

const teamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, default: "", lowercase: true, trim: true },
    role: { type: String, enum: TEAM_ROLES, default: "Moderator" },
    expertise: { type: [String], default: [] },
    presence: { type: String, enum: ["Online", "Away", "Offline"], default: "Online" },
    capacity: { type: Number, default: 8, min: 1, max: 50 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TeamMember", teamMemberSchema);
