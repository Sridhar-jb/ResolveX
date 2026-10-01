const Complaint = require("../models/Complaint");
const User = require("../models/User");
const TeamMember = require("../models/TeamMember");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { recordAudit } = require("../utils/audit");
const { notifyUser } = require("../utils/notify");
const { routeComplaint } = require("../services/routingService");
const stats = require("../services/statsService");
const { buildFilter, LIST_FIELDS } = require("./complaintController");
const { STATUSES } = require("../config/constants");

const overview = asyncHandler(async (_req, res) => {
  const [counts, categories, series, trend, avgHours, activity, team, users] = await Promise.all([
    stats.countsByStatus(),
    stats.categoryDistribution(),
    stats.dailySeries(30),
    stats.weekOverWeek(),
    stats.averageResolutionHours(),
    Notification.find({ audience: "admin" }).sort({ createdAt: -1 }).limit(8).lean(),
    TeamMember.find({ isActive: true }).sort({ name: 1 }).limit(6).lean(),
    User.countDocuments(),
  ]);

  const recent = await Complaint.find()
    .select(LIST_FIELDS)
    .populate("user", "name email avatarColor")
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  res.json({
    success: true,
    overview: {
      counts,
      trend,
      avgResolutionHours: avgHours,
      totalUsers: users,
      categories,
      series,
      recent,
      activity,
      team,
    },
  });
});

const listComplaints = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 20));
  const filter = buildFilter(req.query);

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .select(LIST_FIELDS)
      .populate("user", "name email avatarColor")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Complaint.countDocuments(filter),
  ]);

  res.json({
    success: true,
    complaints,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    total,
  });
});

const assign = asyncHandler(async (req, res) => {
  const members = Array.isArray(req.body?.assignedMembers) ? req.body.assignedMembers : [];
  if (!members.length) throw new ApiError(400, "Pick at least one team member.");
  if (members.length > 5) throw new ApiError(400, "Assign up to five members at a time.");

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, "That complaint does not exist.");

  complaint.assignedMembers = [...new Set(members.map(String))];
  if (["Pending"].includes(complaint.status)) complaint.status = "Assigned";
  complaint.timeline.push({
    status: complaint.status,
    note: `Assigned to ${complaint.assignedMembers.join(", ")}.`,
    byName: req.user.name || "Admin",
  });
  await complaint.save();

  await notifyUser(complaint.user, {
    kind: "assignment",
    title: `${complaint.reference} has an owner`,
    body: `Now with ${complaint.assignedMembers.join(", ")}.`,
    link: "/complaints",
  });
  await recordAudit(req, {
    action: "Complaint assigned",
    entity: "Complaint",
    entityId: complaint._id,
    detail: `${complaint.reference} to ${complaint.assignedMembers.join(", ")}`,
  });

  res.json({ success: true, message: `Assigned to ${complaint.assignedMembers.length} member(s).`, complaint });
});

const autoAssign = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, "That complaint does not exist.");

  const routing = await routeComplaint(complaint);
  if (!routing.assignedMembers.length) throw new ApiError(409, routing.reason);

  complaint.category = routing.category;
  complaint.priority = routing.priority;
  complaint.assignedMembers = routing.assignedMembers;
  complaint.status = "Assigned";
  complaint.routingReason = routing.reason;
  complaint.timeline.push({
    status: "Assigned",
    note: routing.reason,
    byName: "ResolveX routing",
  });
  await complaint.save();

  await notifyUser(complaint.user, {
    kind: "assignment",
    title: `${complaint.reference} has an owner`,
    body: `Routed to ${routing.assignedMembers.join(", ")}.`,
    link: "/complaints",
  });
  await recordAudit(req, {
    action: "Complaint auto-assigned",
    entity: "Complaint",
    entityId: complaint._id,
    detail: complaint.reference,
  });

  res.json({ success: true, message: "Routed automatically.", routing, complaint });
});

const updateStatus = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body || {};
  if (!STATUSES.includes(status)) throw new ApiError(400, "That status is not valid.");

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, "That complaint does not exist.");

  complaint.status = status;
  complaint.remarks = remarks || "";
  complaint.resolvedAt = status === "Resolved" ? new Date() : null;
  complaint.timeline.push({
    status,
    note: remarks || `Status set to ${status}.`,
    byName: req.user.name || "Admin",
  });
  await complaint.save();

  await notifyUser(complaint.user, {
    kind: "status",
    title: `${complaint.reference} is now ${status}`,
    body: remarks || "Open the complaint for the full history.",
    link: "/complaints",
  });
  await recordAudit(req, {
    action: "Status changed",
    entity: "Complaint",
    entityId: complaint._id,
    detail: `${complaint.reference} to ${status}`,
  });

  res.json({ success: true, message: `Marked ${status}.`, complaint });
});

const removeComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, "That complaint does not exist.");

  await complaint.deleteOne();
  await recordAudit(req, {
    action: "Complaint deleted",
    entity: "Complaint",
    entityId: complaint._id,
    detail: complaint.reference,
  });

  res.json({ success: true, message: "Complaint deleted." });
});

const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role && req.query.role !== "All") filter.role = req.query.role;
  if (req.query.search) {
    const term = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: term }, { email: term }];
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).lean();
  const counts = await Complaint.aggregate([{ $group: { _id: "$user", count: { $sum: 1 } } }]);
  const byUser = new Map(counts.map((row) => [String(row._id), row.count]));

  res.json({
    success: true,
    users: users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarColor: user.avatarColor,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      complaints: byUser.get(String(user._id)) || 0,
    })),
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "That account does not exist.");
  if (String(user._id) === req.user.id && req.body.role && req.body.role !== "admin") {
    throw new ApiError(400, "You cannot remove your own admin access.");
  }

  if (req.body.role) user.role = req.body.role;
  if (req.body.isActive !== undefined) user.isActive = Boolean(req.body.isActive);
  await user.save();

  await recordAudit(req, {
    action: "Account updated",
    entity: "User",
    entityId: user._id,
    detail: `${user.email} -> ${user.role}${user.isActive ? "" : " (suspended)"}`,
  });

  res.json({ success: true, message: "Account updated.", user: user.toPublic() });
});

const removeUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw new ApiError(400, "You cannot delete your own account.");

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "That account does not exist.");

  await Promise.all([
    Complaint.deleteMany({ user: user._id }),
    Message.deleteMany({ user: user._id }),
    Notification.deleteMany({ user: user._id }),
    user.deleteOne(),
  ]);

  await recordAudit(req, { action: "Account deleted", entity: "User", entityId: user._id, detail: user.email });

  res.json({ success: true, message: "Account and its complaints were deleted." });
});

module.exports = {
  overview,
  listComplaints,
  assign,
  autoAssign,
  updateStatus,
  removeComplaint,
  listUsers,
  updateUser,
  removeUser,
};
