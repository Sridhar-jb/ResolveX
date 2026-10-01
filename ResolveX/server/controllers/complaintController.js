const Complaint = require("../models/Complaint");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { toBuffer } = require("../utils/buffer");
const { recordAudit } = require("../utils/audit");
const { notifyAdmins, notifyUser } = require("../utils/notify");
const { routeComplaint } = require("../services/routingService");
const stats = require("../services/statsService");

const LIST_FIELDS =
  "reference title description category priority status location assignedMembers remarks routingReason imageContentType createdAt updatedAt resolvedAt timeline";

const buildFilter = (query, base = {}) => {
  const filter = { ...base };
  if (query.status && query.status !== "All") filter.status = query.status;
  if (query.category && query.category !== "All") filter.category = query.category;
  if (query.priority && query.priority !== "All") filter.priority = query.priority;
  if (query.search) {
    const term = new RegExp(String(query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: term }, { description: term }, { reference: term }, { category: term }];
  }
  return filter;
};

const create = asyncHandler(async (req, res) => {
  const { title, description, category, priority, location } = req.body || {};

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "A complaint needs a title and a description.");
  }

  const routing = await routeComplaint({ title, description, category, priority });
  const status = routing.assignedMembers.length ? "Assigned" : "Pending";

  const complaint = await Complaint.create({
    title: title.trim(),
    description: description.trim(),
    location: (location || "").trim(),
    category: routing.category,
    priority: routing.priority,
    status,
    assignedMembers: routing.assignedMembers,
    routingReason: routing.reason,
    user: req.user.id,
    imageData: req.file ? req.file.buffer : null,
    imageContentType: req.file ? req.file.mimetype : "",
    imageName: req.file ? req.file.originalname : "",
    timeline: [
      { status: "Pending", note: "Complaint received.", byName: req.user.name || "You" },
      ...(status === "Assigned"
        ? [{ status: "Assigned", note: routing.reason, byName: "ResolveX routing" }]
        : []),
    ],
  });

  await notifyUser(req.user.id, {
    kind: "complaint",
    title: `${complaint.reference} filed`,
    body: status === "Assigned"
      ? `Routed to ${routing.assignedMembers.join(", ")}.`
      : "Waiting for a team member to pick it up.",
    link: "/complaints",
  });

  await notifyAdmins({
    kind: "complaint",
    title: "New complaint submitted",
    body: `${complaint.reference} - ${complaint.title} (${complaint.priority})`,
    link: "/admin/complaints",
  });

  await recordAudit(req, {
    action: "Complaint filed",
    entity: "Complaint",
    entityId: complaint._id,
    detail: complaint.reference,
  });

  const created = complaint.toObject();
  delete created.imageData;

  res.status(201).json({
    success: true,
    message: "Complaint submitted. You can track it from My Complaints.",
    complaint: created,
    routing,
  });
});

const listMine = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query, { user: req.user.id });
  const complaints = await Complaint.find(filter).select(LIST_FIELDS).sort({ createdAt: -1 }).lean();
  res.json({ success: true, count: complaints.length, complaints });
});

const mySummary = asyncHandler(async (req, res) => {
  const match = { user: req.user.id };
  const [counts, categories, monthly, recent] = await Promise.all([
    stats.countsByStatus(match),
    stats.categoryDistribution(match),
    stats.monthlyBreakdown(6, match),
    Complaint.find(match).select(LIST_FIELDS).sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const thisMonth = await Complaint.countDocuments({ ...match, createdAt: { $gte: startOfMonth } });

  res.json({
    success: true,
    summary: {
      ...counts,
      active: counts.assigned + counts.inProgress,
      thisMonth,
      categories,
      monthly,
      recent,
    },
  });
});

const getOne = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate("user", "name email avatarColor");
  if (!complaint) throw new ApiError(404, "That complaint does not exist.");

  const ownerId = complaint.user?._id?.toString() || complaint.user?.toString();
  if (ownerId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You can only open your own complaints.");
  }

  const result = complaint.toObject();
  delete result.imageData;

  res.json({ success: true, complaint: result });
});

const getEvidence = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).select("+imageData user imageContentType");
  if (!complaint) throw new ApiError(404, "That complaint does not exist.");

  const ownerId = complaint.user?.toString();
  if (ownerId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You can only open your own evidence.");
  }

  const buffer = toBuffer(complaint.imageData);
  if (!buffer || !complaint.imageContentType) {
    throw new ApiError(404, "No evidence was attached to this complaint.");
  }

  res.set({
    "Content-Type": complaint.imageContentType,
    "Content-Length": String(buffer.length),
    "Content-Disposition": "inline",
    "Cache-Control": "private, max-age=3600",
  });
  res.end(buffer);
});

const update = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, "That complaint does not exist.");
  if (complaint.user.toString() !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You can only edit your own complaints.");
  }
  if (["Resolved", "Rejected"].includes(complaint.status) && req.user.role !== "admin") {
    throw new ApiError(400, "Closed complaints cannot be edited. File a new one instead.");
  }

  const { title, description, category, priority, location } = req.body || {};
  if (title) complaint.title = title.trim();
  if (description) complaint.description = description.trim();
  if (category) complaint.category = category;
  if (priority) complaint.priority = priority;
  if (location !== undefined) complaint.location = location;

  if (req.file) {
    complaint.imageData = req.file.buffer;
    complaint.imageContentType = req.file.mimetype;
    complaint.imageName = req.file.originalname;
  }

  await complaint.save();
  await recordAudit(req, {
    action: "Complaint edited",
    entity: "Complaint",
    entityId: complaint._id,
    detail: complaint.reference,
  });

  const updated = complaint.toObject();
  delete updated.imageData;

  res.json({ success: true, message: "Complaint updated.", complaint: updated });
});

const remove = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, "That complaint does not exist.");
  if (complaint.user.toString() !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You can only delete your own complaints.");
  }

  await complaint.deleteOne();
  await recordAudit(req, {
    action: "Complaint deleted",
    entity: "Complaint",
    entityId: complaint._id,
    detail: complaint.reference,
  });

  res.json({ success: true, message: "Complaint deleted." });
});

module.exports = { create, listMine, mySummary, getOne, getEvidence, update, remove, buildFilter, LIST_FIELDS };
