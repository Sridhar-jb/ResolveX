const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 30);

  const filter = {};
  if (req.query.search) {
    const term = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ action: term }, { actorName: term }, { detail: term }, { entity: term }];
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ success: true, logs, page, pages: Math.max(1, Math.ceil(total / limit)), total });
});

module.exports = { list };
