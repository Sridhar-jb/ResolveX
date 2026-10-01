const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const audienceFilter = (user) =>
  user.role === "admin" ? { audience: "admin" } : { audience: "user", user: user.id };

const list = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Number(req.query.limit) || 30);
  const filter = audienceFilter(req.user);

  const [notifications, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ ...filter, read: false }),
  ]);

  res.json({ success: true, notifications, unread });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    ...audienceFilter(req.user),
  });
  if (!notification) throw new ApiError(404, "That notification does not exist.");

  notification.read = true;
  await notification.save();

  res.json({ success: true, notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ ...audienceFilter(req.user), read: false }, { $set: { read: true } });
  res.json({ success: true, message: "All caught up." });
});

const remove = asyncHandler(async (req, res) => {
  const result = await Notification.deleteOne({ _id: req.params.id, ...audienceFilter(req.user) });
  if (!result.deletedCount) throw new ApiError(404, "That notification does not exist.");
  res.json({ success: true, message: "Notification cleared." });
});

module.exports = { list, markRead, markAllRead, remove };
