const STATUSES = ["Pending", "Assigned", "In Progress", "Resolved", "Rejected"];
const PRIORITIES = ["Low", "Medium", "High"];
const USER_ROLES = ["user", "moderator", "support", "admin"];
const TEAM_ROLES = ["Administrator", "Moderator", "Support", "Field Agent"];

const DEFAULT_CATEGORIES = [
  { name: "Hostel", color: "#8b5cf6", description: "Rooms, mess, wardens and hostel facilities" },
  { name: "Infrastructure", color: "#3b82f6", description: "Buildings, roads, lifts and campus repairs" },
  { name: "Cyber", color: "#22d3ee", description: "Accounts, network, portals and digital services" },
  { name: "Academic", color: "#ec4899", description: "Classes, exams, marks and faculty matters" },
  { name: "Electricity", color: "#f59e0b", description: "Power cuts, wiring, lights and fittings" },
  { name: "Water", color: "#38bdf8", description: "Supply, taps, leaks and drainage" },
  { name: "Transport", color: "#34d399", description: "Buses, routes, drivers and timings" },
  { name: "Other", color: "#f472b6", description: "Anything that does not fit the list" },
];

module.exports = { STATUSES, PRIORITIES, USER_ROLES, TEAM_ROLES, DEFAULT_CATEGORIES };
