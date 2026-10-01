const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Setting = require("../models/Setting");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/token");
const { recordAudit } = require("../utils/audit");
const { notifyAdmins } = require("../utils/notify");

const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#ec4899", "#14b8a6", "#f59e0b"];

const register = asyncHandler(async (req, res) => {
  const settings = await Setting.current();
  if (!settings.allowRegistration) {
    throw new ApiError(403, "New sign-ups are paused. Contact an administrator.");
  }

  const name = (req.body?.name || "").trim();
  const email = (req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password || "";

  if (!name || !email || !password) throw new ApiError(400, "Name, email and password are all required.");
  if (password.length < 6) throw new ApiError(400, "Use at least 6 characters for your password.");
  if (await User.findOne({ email })) throw new ApiError(409, "That email is already registered. Sign in instead.");

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  });

  await notifyAdmins({
    kind: "account",
    title: "New account created",
    body: `${user.name} joined ResolveX.`,
    link: "/admin/users",
  });
  await recordAudit(req, { action: "Account created", entity: "User", entityId: user._id, detail: user.email });

  res.status(201).json({
    success: true,
    message: "Account created. Sign in to get started.",
    user: user.toPublic(),
  });
});

const login = asyncHandler(async (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();
  const password = req.body?.password || "";

  if (!email || !password) throw new ApiError(400, "Enter your email and password.");

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new ApiError(404, "No account uses that email.");
  if (!user.isActive) throw new ApiError(403, "That account is suspended. Contact an administrator.");
  if (!(await bcrypt.compare(password, user.password))) throw new ApiError(401, "That password is not right.");

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);

  req.user = { id: String(user._id), name: user.name, role: user.role };
  await recordAudit(req, { action: "Signed in", entity: "User", entityId: user._id });

  res.json({ success: true, message: `Welcome back, ${user.name}.`, token, user: user.toPublic() });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "That account no longer exists.");
  res.json({ success: true, user: user.toPublic() });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, "That account no longer exists.");

  const { name, phone, department, avatarColor, preferences } = req.body || {};
  const email = req.body?.email?.trim().toLowerCase();

  if (email && email !== user.email) {
    if (await User.findOne({ email })) throw new ApiError(409, "Another account already uses that email.");
    user.email = email;
  }

  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone;
  if (department !== undefined) user.department = department;
  if (avatarColor) user.avatarColor = avatarColor;
  if (preferences) user.preferences = { ...user.preferences.toObject(), ...preferences };

  await user.save();
  await recordAudit(req, { action: "Profile updated", entity: "User", entityId: user._id });

  res.json({ success: true, message: "Profile saved.", user: user.toPublic() });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) throw new ApiError(400, "Enter your current and new password.");
  if (newPassword.length < 6) throw new ApiError(400, "Use at least 6 characters for your new password.");

  const user = await User.findById(req.user.id).select("+password");
  if (!user) throw new ApiError(404, "That account no longer exists.");
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw new ApiError(401, "Your current password is not right.");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  await recordAudit(req, { action: "Password changed", entity: "User", entityId: user._id });

  res.json({ success: true, message: "Password changed." });
});

module.exports = { register, login, me, updateProfile, changePassword };
