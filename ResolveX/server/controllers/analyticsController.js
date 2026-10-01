const Complaint = require("../models/Complaint");
const asyncHandler = require("../utils/asyncHandler");
const stats = require("../services/statsService");
const { LIST_FIELDS } = require("./complaintController");

const analytics = asyncHandler(async (req, res) => {
  const days = Math.min(180, Math.max(7, Number(req.query.days) || 30));

  const [counts, categories, priorities, series, monthly, workload, avgHours, trend] = await Promise.all([
    stats.countsByStatus(),
    stats.categoryDistribution(),
    stats.priorityDistribution(),
    stats.dailySeries(days),
    stats.monthlyBreakdown(6),
    stats.memberWorkload(),
    stats.averageResolutionHours(),
    stats.weekOverWeek(),
  ]);

  const resolutionRate = counts.total ? Math.round((counts.resolved / counts.total) * 100) : 0;

  res.json({
    success: true,
    analytics: {
      counts,
      categories,
      priorities,
      series,
      monthly,
      workload,
      avgResolutionHours: avgHours,
      resolutionRate,
      trend,
      days,
    },
  });
});

const report = asyncHandler(async (req, res) => {
  const days = Math.min(365, Math.max(7, Number(req.query.days) || 30));
  const from = new Date(Date.now() - days * 86400000);
  const match = { createdAt: { $gte: from } };

  const [counts, categories, priorities, avgHours, rows] = await Promise.all([
    stats.countsByStatus(match),
    stats.categoryDistribution(match),
    stats.priorityDistribution(match),
    stats.averageResolutionHours(match),
    Complaint.find(match)
      .select(LIST_FIELDS)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean(),
  ]);

  res.json({
    success: true,
    report: {
      generatedAt: new Date(),
      rangeDays: days,
      from,
      counts,
      categories,
      priorities,
      avgResolutionHours: avgHours,
      resolutionRate: counts.total ? Math.round((counts.resolved / counts.total) * 100) : 0,
      rows,
    },
  });
});

module.exports = { analytics, report };
