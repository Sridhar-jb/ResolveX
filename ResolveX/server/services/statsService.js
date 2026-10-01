const Complaint = require("../models/Complaint");
const { STATUSES } = require("../config/constants");

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const daysAgo = (days) => startOfDay(new Date(Date.now() - days * 86400000));

const countsByStatus = async (match = {}) => {
  const rows = await Complaint.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const result = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  rows.forEach((row) => {
    result[row._id] = row.count;
  });

  return {
    total: Object.values(result).reduce((sum, value) => sum + value, 0),
    pending: result.Pending,
    assigned: result.Assigned,
    inProgress: result["In Progress"],
    resolved: result.Resolved,
    rejected: result.Rejected,
  };
};

const categoryDistribution = async (match = {}) => {
  const rows = await Complaint.aggregate([
    { $match: match },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const total = rows.reduce((sum, row) => sum + row.count, 0) || 1;
  return rows.map((row) => ({
    name: row._id || "Other",
    count: row.count,
    share: Math.round((row.count / total) * 100),
  }));
};

const priorityDistribution = async (match = {}) => {
  const rows = await Complaint.aggregate([
    { $match: match },
    { $group: { _id: "$priority", count: { $sum: 1 } } },
  ]);
  const base = { Low: 0, Medium: 0, High: 0 };
  rows.forEach((row) => {
    base[row._id] = row.count;
  });
  return base;
};

// Daily submitted/resolved counts for the trend chart.
const dailySeries = async (days = 30, match = {}) => {
  const from = daysAgo(days - 1);

  const rows = await Complaint.aggregate([
    { $match: { ...match, createdAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        submitted: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
        assigned: { $sum: { $cond: [{ $eq: ["$status", "Assigned"] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
      },
    },
  ]);

  const byDate = new Map(rows.map((row) => [row._id, row]));
  const series = [];

  for (let index = 0; index < days; index += 1) {
    const date = new Date(from.getTime() + index * 86400000);
    const key = date.toISOString().slice(0, 10);
    const row = byDate.get(key);
    series.push({
      date: key,
      submitted: row?.submitted || 0,
      assigned: row?.assigned || 0,
      inProgress: row?.inProgress || 0,
      resolved: row?.resolved || 0,
    });
  }

  return series;
};

const weekOverWeek = async (match = {}) => {
  const thisWeek = await Complaint.countDocuments({ ...match, createdAt: { $gte: daysAgo(6) } });
  const lastWeek = await Complaint.countDocuments({
    ...match,
    createdAt: { $gte: daysAgo(13), $lt: daysAgo(6) },
  });

  if (!lastWeek) return { thisWeek, lastWeek, change: thisWeek ? 100 : 0 };
  return { thisWeek, lastWeek, change: Math.round(((thisWeek - lastWeek) / lastWeek) * 100) };
};

const averageResolutionHours = async (match = {}) => {
  const rows = await Complaint.aggregate([
    { $match: { ...match, status: "Resolved", resolvedAt: { $ne: null } } },
    { $project: { hours: { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 3600000] } } },
    { $group: { _id: null, average: { $avg: "$hours" } } },
  ]);

  return rows.length ? Math.round(rows[0].average * 10) / 10 : 0;
};

const memberWorkload = async () => {
  const rows = await Complaint.aggregate([
    { $unwind: "$assignedMembers" },
    {
      $group: {
        _id: "$assignedMembers",
        open: { $sum: { $cond: [{ $in: ["$status", ["Pending", "Assigned", "In Progress"]] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return rows.map((row) => ({ name: row._id, open: row.open, resolved: row.resolved, total: row.total }));
};

const monthlyBreakdown = async (months = 6, match = {}) => {
  const from = new Date();
  from.setMonth(from.getMonth() - (months - 1));
  from.setDate(1);
  from.setHours(0, 0, 0, 0);

  const rows = await Complaint.aggregate([
    { $match: { ...match, createdAt: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        submitted: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
      },
    },
  ]);

  const byMonth = new Map(rows.map((row) => [row._id, row]));
  const series = [];

  for (let index = 0; index < months; index += 1) {
    const date = new Date(from.getFullYear(), from.getMonth() + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const row = byMonth.get(key);
    series.push({
      month: key,
      label: date.toLocaleString("en-US", { month: "short" }),
      submitted: row?.submitted || 0,
      resolved: row?.resolved || 0,
    });
  }

  return series;
};

module.exports = {
  countsByStatus,
  categoryDistribution,
  priorityDistribution,
  dailySeries,
  weekOverWeek,
  averageResolutionHours,
  memberWorkload,
  monthlyBreakdown,
};
