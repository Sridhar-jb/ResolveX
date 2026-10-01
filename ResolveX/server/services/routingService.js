const Complaint = require("../models/Complaint");
const Category = require("../models/Category");
const TeamMember = require("../models/TeamMember");
const Setting = require("../models/Setting");

const KEYWORDS = {
  Electricity: ["electric", "power", "current", "voltage", "light", "fan", "switch", "socket", "wiring", "short circuit"],
  Water: ["water", "tap", "pipe", "plumbing", "leak", "washroom", "bathroom", "drain", "sewage", "supply"],
  Transport: ["bus", "transport", "driver", "route", "shuttle", "vehicle", "stop", "timing"],
  Hostel: ["hostel", "room", "warden", "bed", "mess", "food", "roommate", "laundry", "block"],
  Academic: ["exam", "marks", "grade", "faculty", "class", "course", "attendance", "assignment", "lab", "syllabus"],
  Infrastructure: ["road", "building", "ceiling", "door", "window", "furniture", "lift", "elevator", "campus", "wall", "street light"],
  Cyber: ["login", "password", "portal", "wifi", "network", "internet", "account", "website", "server", "phishing"],
};

const URGENT = /urgent|emergency|danger|unsafe|fire|shock|flood|critical|immediately|injur|collapse/i;
const MODERATE = /not working|broken|leak|blocked|failed|delay|repeated|again|stuck/i;

const normalize = (value = "") => String(value).toLowerCase().trim();

const detectCategory = async (title, description, supplied) => {
  const text = normalize(`${title} ${description}`);

  const categories = await Category.find({ isActive: true }).lean();
  const rules = { ...KEYWORDS };
  categories.forEach((category) => {
    if (category.keywords?.length) rules[category.name] = category.keywords.map(normalize);
  });

  let best = supplied && supplied !== "Select category" ? supplied : "Other";
  let bestScore = 0;

  Object.entries(rules).forEach(([name, words]) => {
    const score = words.reduce((total, word) => total + (text.includes(normalize(word)) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  });

  return best;
};

const detectPriority = (title, description, supplied, fallback = "Medium") => {
  const text = `${title} ${description}`;
  if (URGENT.test(text)) return "High";
  if (supplied) return supplied;
  if (MODERATE.test(text)) return "Medium";
  return fallback;
};

// Picks the least-loaded active members whose expertise matches the category.
const pickMembers = async (category, priority) => {
  const members = await TeamMember.find({ isActive: true }).lean();
  if (!members.length) return { members: [], reason: "No team members are set up yet." };

  const specialists = members.filter((member) => member.expertise?.includes(category));
  const pool = specialists.length ? specialists : members.filter((m) => m.presence !== "Offline");
  if (!pool.length) return { members: [], reason: "Every member is offline right now." };

  const names = pool.map((member) => member.name);
  const workload = await Complaint.aggregate([
    { $match: { assignedMembers: { $in: names }, status: { $nin: ["Resolved", "Rejected"] } } },
    { $unwind: "$assignedMembers" },
    { $match: { assignedMembers: { $in: names } } },
    { $group: { _id: "$assignedMembers", count: { $sum: 1 } } },
  ]);

  const load = new Map(workload.map((row) => [row._id, row.count]));
  const presenceRank = { Online: 0, Away: 1, Offline: 2 };

  const ranked = [...pool].sort((a, b) => {
    const loadDiff = (load.get(a.name) || 0) - (load.get(b.name) || 0);
    if (loadDiff !== 0) return loadDiff;
    return presenceRank[a.presence] - presenceRank[b.presence];
  });

  const size = priority === "High" ? 3 : priority === "Medium" ? 2 : 1;
  const chosen = ranked.slice(0, size).map((member) => member.name);

  return {
    members: chosen,
    reason: specialists.length
      ? `Matched ${category} expertise and balanced the open workload.`
      : `No ${category} specialist was free, so the lightest-loaded members took it.`,
  };
};

const routeComplaint = async ({ title, description, category, priority }) => {
  const settings = await Setting.current();
  const finalCategory = await detectCategory(title, description, category);
  const finalPriority = detectPriority(title, description, priority, settings.defaultPriority);

  if (!settings.autoAssign) {
    return {
      category: finalCategory,
      priority: finalPriority,
      assignedMembers: [],
      reason: "Auto-assignment is switched off in system settings.",
    };
  }

  const { members, reason } = await pickMembers(finalCategory, finalPriority);
  return { category: finalCategory, priority: finalPriority, assignedMembers: members, reason };
};

module.exports = { routeComplaint, detectCategory, detectPriority };
