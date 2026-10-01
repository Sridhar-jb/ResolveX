export const STATUSES = ["Pending", "Assigned", "In Progress", "Resolved", "Rejected"];
export const PRIORITIES = ["Low", "Medium", "High"];

export const STATUS_CLASS = {
  Pending: "pill--pending",
  Assigned: "pill--assigned",
  "In Progress": "pill--progress",
  Resolved: "pill--resolved",
  Rejected: "pill--rejected",
};

export const PRIORITY_CLASS = {
  Low: "pill--low",
  Medium: "pill--medium",
  High: "pill--high",
};

export const CATEGORY_COLORS = {
  Hostel: "#8b5cf6",
  Infrastructure: "#3b82f6",
  Cyber: "#22d3ee",
  Academic: "#ec4899",
  Electricity: "#f59e0b",
  Water: "#38bdf8",
  Transport: "#34d399",
  Other: "#f472b6",
};

export const categoryColor = (name, index = 0) => {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  const palette = ["#6366f1", "#22d3ee", "#d946ef", "#34d399", "#f59e0b", "#fb7185"];
  return palette[index % palette.length];
};

export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase() || "?";

export const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const timeAgo = (value) => {
  if (!value) return "";
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(value);
};

export const greeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const fileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const shortDay = (isoDate) =>
  new Date(isoDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// Turns any axios/server error into one sentence we can show the person.
export const errorMessage = (error, fallback = "Something went wrong. Try again.") =>
  error?.response?.data?.message || error?.message || fallback;
