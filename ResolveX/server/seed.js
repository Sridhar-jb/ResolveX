/**
 * Seeds ResolveX with an admin, a demo customer, categories, a team and
 * a handful of complaints so every screen has something to show.
 *
 *   cd server && npm run seed
 */
require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const User = require("./models/User");
const Complaint = require("./models/Complaint");
const Category = require("./models/Category");
const TeamMember = require("./models/TeamMember");
const Notification = require("./models/Notification");
const AuditLog = require("./models/AuditLog");
const Setting = require("./models/Setting");
const { DEFAULT_CATEGORIES } = require("./config/constants");

const TEAM = [
  { name: "Sridhar", email: "sridhar@resolvex.app", role: "Administrator", presence: "Online", expertise: ["Infrastructure", "Cyber", "Other"] },
  { name: "Akash", email: "akash@resolvex.app", role: "Moderator", presence: "Online", expertise: ["Hostel", "Water"] },
  { name: "Priya", email: "priya@resolvex.app", role: "Support", presence: "Away", expertise: ["Academic", "Other"] },
  { name: "Rahul", email: "rahul@resolvex.app", role: "Moderator", presence: "Online", expertise: ["Electricity", "Infrastructure"] },
  { name: "Sneha", email: "sneha@resolvex.app", role: "Field Agent", presence: "Online", expertise: ["Water", "Transport"] },
  { name: "Naveen", email: "naveen@resolvex.app", role: "Field Agent", presence: "Offline", expertise: ["Transport", "Hostel"] },
];

const COMPLAINTS = [
  { title: "Hostel water issue", description: "No water supply in Block B since morning. The overhead tank seems empty and the pump is not running.", category: "Hostel", priority: "Medium", status: "Assigned", days: 10 },
  { title: "Internet not working", description: "Campus wifi keeps dropping every few minutes in the library wing. Cannot stay connected long enough to submit work.", category: "Cyber", priority: "High", status: "Pending", days: 11 },
  { title: "Library access", description: "My ID card is not opening the library turnstile even though my account is active.", category: "Other", priority: "Low", status: "Resolved", days: 23 },
  { title: "Mess food quality", description: "Food served at dinner has been undercooked for the last week. Several students reported stomach pain.", category: "Hostel", priority: "Medium", status: "Assigned", days: 35 },
  { title: "Cyber issue", description: "Suspicious login attempt notification on my student portal account. Please check and secure it.", category: "Cyber", priority: "High", status: "In Progress", days: 44 },
  { title: "Street light repair", description: "Street lights between the hostel gate and the main block have been off for two weeks. The path is unsafe at night.", category: "Infrastructure", priority: "Medium", status: "Pending", days: 48 },
  { title: "Lab projector broken", description: "The projector in lab 204 shows a blue screen. Classes are being taught without slides.", category: "Academic", priority: "Low", status: "Assigned", days: 5 },
  { title: "Bus timing changed without notice", description: "The 8:10 bus left at 8:00 for three days straight and students were left behind.", category: "Transport", priority: "Medium", status: "In Progress", days: 3 },
];

const daysAgo = (days) => new Date(Date.now() - days * 86400000);

const run = async () => {
  await connectDB();
  console.log("Seeding ResolveX...");

  await Promise.all([
    User.deleteMany({}),
    Complaint.deleteMany({}),
    Category.deleteMany({}),
    TeamMember.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    Setting.deleteMany({}),
  ]);

  await Setting.create({ key: "global" });
  await Category.insertMany(DEFAULT_CATEGORIES);
  await TeamMember.insertMany(TEAM);

  const password = await bcrypt.hash("password123", 10);

  const admin = await User.create({
    name: "Sridhar",
    email: "admin@resolvex.app",
    password,
    role: "admin",
    department: "Administration",
    avatarColor: "#8b5cf6",
  });

  const customer = await User.create({
    name: "Sridhar D",
    email: "user@resolvex.app",
    password,
    role: "user",
    department: "Computer Science",
    avatarColor: "#3b82f6",
  });

  for (const item of COMPLAINTS) {
    const createdAt = daysAgo(item.days);
    const members = item.status === "Pending" ? [] : [TEAM[Math.floor(Math.random() * 4)].name];

    const complaint = new Complaint({
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority,
      status: item.status,
      user: customer._id,
      assignedMembers: members,
      routingReason: `Matched ${item.category} expertise and balanced the open workload.`,
      resolvedAt: item.status === "Resolved" ? daysAgo(item.days - 2) : null,
      timeline: [{ status: "Pending", note: "Complaint received.", byName: customer.name, at: createdAt }],
    });

    await complaint.save();
    await Complaint.updateOne(
      { _id: complaint._id },
      { $set: { createdAt, updatedAt: createdAt } },
      { timestamps: false }
    );
  }

  await Notification.insertMany([
    { audience: "admin", kind: "complaint", title: "New complaint submitted", body: "Bus timing changed without notice", link: "/admin/complaints" },
    { audience: "admin", kind: "assignment", title: "Issue assigned to team", body: "Lab projector broken went to Rahul", link: "/admin/complaints" },
    { audience: "admin", kind: "status", title: "Complaint resolved", body: "Library access was closed successfully", link: "/admin/complaints" },
    { audience: "user", user: customer._id, kind: "status", title: "RX-003 is now Resolved", body: "Your card was re-issued at the front desk.", link: "/complaints" },
  ]);

  console.log("\nSeed complete.");
  console.log("  Admin    admin@resolvex.app / password123");
  console.log("  Customer user@resolvex.app  / password123\n");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
